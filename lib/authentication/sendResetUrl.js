import { fireApp } from "@/important/firebase";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { realEscapeString } from "../utilities";
import { resetPasswordEmail } from "../emailTemplate";
import { EmailJs } from "../EmailJs";

// Function to get email subject based on language
function getResetEmailSubject(language) {
    const subjects = {
        en: "Password Reset Request - TapIt 🔒",
        fr: "Demande de réinitialisation de mot de passe - TapIt 🔒",
        es: "Solicitud de restablecimiento de contraseña - TapIt 🔒",
        vm: "Yêu cầu đặt lại mật khẩu - TapIt 🔒",
        zh: "密码重置请求 - TapIt 🔒"
    };
    return subjects[language] || subjects.en;
}

export async function sendResetUrl(payload) {
    const { email, uid, expiresIn } = payload;
    
    try {
        const dbRef = collection(fireApp, "accountsReset");
        const collectionSnap = await getDocs(collection(fireApp, "accounts"));

        const cleanEmail = realEscapeString(email);
        const cleanUID = realEscapeString(uid);
        let userId;
        let userLanguage = 'en'; // Default language

        const resetUrl = `https://www.tapit.fr/reset-password/${cleanUID}`;

        let status = false;

        // Find the user and get their language preference
        collectionSnap.forEach((credential) => {
            const data = credential.data();
            const { email: dbEmail, userId: userKey, language } = data;

            if (cleanEmail === dbEmail) {
                status = true;
                userId = userKey;
                // Get user's language preference, fallback to 'en' if not set
                userLanguage = language || 'en';
                console.log('🌍 Found user language preference:', userLanguage);
            }
        });

        if (!status) throw new Error("Email does not exist!");

        // Store reset request with user language
        await setDoc(doc(dbRef, `${cleanUID}`), {
            uid: cleanUID,
            expiresIn: expiresIn,
            userId,
            language: userLanguage // Store language for potential future use
        });

        console.log('📧 Preparing password reset email in language:', userLanguage);

        // Generate localized email content
        const emailSubject = getResetEmailSubject(userLanguage);
        const emailPayload = {
            htmlContent: resetPasswordEmail(resetUrl, userLanguage),
            email: cleanEmail,
            name: "Client", // You might want to get the actual username from the database
            subject: emailSubject,
            language: userLanguage
        };

        console.log('📤 Sending password reset email with subject:', emailSubject);

        const emailResult = await EmailJs(
            emailPayload.name,
            emailPayload.email,
            emailPayload.subject,
            emailPayload.htmlContent
        );

        console.log('✅ Password reset email sent successfully in', userLanguage, emailResult);

    } catch (error) {
        console.error('❌ Error in sendResetUrl:', error);
        throw new Error(error);
    }
}