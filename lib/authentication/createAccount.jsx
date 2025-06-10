import { fireApp } from "@/important/firebase";
import { generateId, realEscapeString} from "../utilities";
import { collection, doc, setDoc } from "firebase/firestore";
import { generateSalt, hashPassword } from "./encryption";
import { EmailJs } from "../EmailJs";
import Cookies from 'js-cookie';

// Import the email templates using require for CommonJS compatibility
const { welcomeEmail } = require("../emailTemplate");

// Function to detect user language from browser cookies
function getUserLanguageFromCookie() {
    // Try to get language from cookies
    if (typeof window !== 'undefined') {
        const savedLanguage = Cookies.get('language');
        if (savedLanguage && ['en', 'fr', 'es', 'vm', 'zh'].includes(savedLanguage)) {
            return savedLanguage;
        }
        
        // Fallback to browser language
        const browserLang = navigator.language?.split('-')[0];
        if (browserLang && ['en', 'fr', 'es', 'vm', 'zh'].includes(browserLang)) {
            return browserLang;
        }
    }
    
    return 'en'; // Default fallback
}

// Function to get email subject based on language
function getEmailSubject(language) {
    const subjects = {
        en: "Welcome to TapIt - Your account is ready! 🚀",
        fr: "Bienvenue sur TapIt - Votre compte est prêt ! 🚀",
        es: "¡Bienvenido a TapIt - Tu cuenta está lista! 🚀",
        vm: "Chào mừng đến với TapIt - Tài khoản của bạn đã sẵn sàng! 🚀",
        zh: "欢迎来到 TapIt - 您的账户已准备就绪！🚀"
    };
    return subjects[language] || subjects.en;
}

export const createAccount = async (data) => {
    const { email, username, password } = data;
    const userId = generateId();
    const generatedUserId = userId;

    console.log('🚀 Starting account creation for:', { email, username, userId });

    try {
        // Detect user language
        const userLanguage = getUserLanguageFromCookie();
        console.log('🌍 Detected user language:', userLanguage);

        const accountRef = collection(fireApp, "accounts");
        const accountDetailsRef = collection(fireApp, "AccountData");

        const cleanUsername = realEscapeString(username);
        const cleanEmail = realEscapeString(email);
        const cleanPassword = realEscapeString(password);
        
        const salt = generateSalt();
        const hashedPasword = hashPassword(cleanPassword, salt);

        console.log('🔐 Password hashed, preparing multilingual email...');

        // Generate email content in user's language
        const emailSubject = getEmailSubject(userLanguage);
        const emailPayload = {
            htmlContent: welcomeEmail(cleanEmail, cleanPassword, cleanUsername, userLanguage),
            email: cleanEmail,
            name: cleanUsername,
            password: cleanPassword,
            language: userLanguage,
            subject: emailSubject
        };

        console.log('📧 Attempting to send welcome email in language:', userLanguage);

        try {
            const emailResult = await EmailJs(
                emailPayload.name, 
                emailPayload.email, 
                emailPayload.subject,
                emailPayload.htmlContent
            );

            console.log('✅ Email sent successfully:', emailResult);

        } catch (emailError) {
            console.error('❌ Email sending failed:', {
                error: emailError.message,
                stack: emailError.stack,
                recipientEmail: emailPayload.email,
                recipientName: emailPayload.name,
                language: userLanguage
            });

            // Log more details about the email error
            if (emailError.originalError) {
                console.error('📧 Original email error:', emailError.originalError);
            }

            if (emailError.responseData) {
                console.error('📊 Email API response data:', emailError.responseData);
            }

            // Decide whether to continue or fail
            // Option 1: Fail the entire account creation (current behavior)
            throw new Error(`Account creation failed due to email error: ${emailError.message}`);
            
            // Option 2: Continue without email (uncomment this instead)
            // console.warn('⚠️ Continuing account creation without email...');
        }

        console.log('💾 Saving account data to Firestore...');

        // Save account credentials with language preference
        await setDoc(doc(accountRef, `${userId}`), {
            userId: userId,
            email: cleanEmail,
            username: cleanUsername,
            password: hashedPasword,
            mySalt: salt,
            language: userLanguage, // Store user's language preference
            createdAt: new Date().toISOString()
        });

        console.log('✅ Account credentials saved');

        // Save account details/profile with language preference
        await setDoc(doc(accountDetailsRef, `${userId}`), {
            displayName: cleanUsername,
            links: [],
            profilePhoto: "",
            selectedTheme: "Lake White",
            language: userLanguage, // Store language preference here too
            createdAt: new Date().toISOString()
        });

        console.log('✅ Account profile created');

        console.log('🎉 Account creation completed successfully for userId:', generatedUserId);
        return generatedUserId;

    } catch (error) {
        console.error('❌ Account creation failed:', {
            error: error.message,
            stack: error.stack,
            userId: generatedUserId,
            email: data.email,
            username: data.username
        });
        
        throw new Error(`Account creation failed: ${error.message}`);
    }
};