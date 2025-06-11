"use client"
import { useDebounce } from "@/LocalHooks/useDebounce";
import { fireApp } from "@/important/firebase";
import { createAccount } from "@/lib/authentication/createAccount";
import { getSessionCookie, setSessionCookie } from "@/lib/authentication/session";
import { validateEmail, validatePassword } from "@/lib/utilities";
import { useTranslation } from "@/lib/useTranslation";
import { collection, onSnapshot } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { FaCheck, FaEye, FaEyeSlash, FaX } from "react-icons/fa6";

export default function SignUpForm() {
    const router = useRouter();
    const { t, isInitialized } = useTranslation();
    
    const [seePassord, setSeePassord] = useState(true);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [hasError, setHasError] = useState({
        username: 0,
        email: 0,
        password: 0,
    });
    const [canProceed, setCanProceed] = useState(false);
    const [existingUsernames, setExistingUsernames] = useState([]);
    const [existingEmail, setExistingEmail] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false); // Track success state
    
    // Use refs to prevent infinite loops
    const isInitializedRef = useRef(false);
    const unsubscribeRef = useRef(null);
    
    const debouncedUsername = useDebounce(username, 500);
    const debouncedPassword = useDebounce(password, 500);
    const debouncedEmail = useDebounce(email, 500);

    // Memoize the translation function calls
    const translations = useMemo(() => {
        if (!isInitialized) return {};
        
        return {
            cannotSubmit: t('signup.cannot_submit'),
            somethingWentWrong: t('signup.something_went_wrong'),
            settingUpAccount: t('signup.setting_up_account'),
            couldNotComplete: t('signup.could_not_complete_registration'),
            setupComplete: t('signup.setup_complete'),
            usernameTaken: t('signup.username_taken'),
            usernameTooShort: t('signup.username_too_short'),
            invalidUsernameFormat: t('signup.invalid_username_format'),
            accountExists: t('signup.account_exists'),
            invalidEmailFormat: t('signup.invalid_email_format'),
            title: t('signup.title'),
            usernamePlaceholder: t('signup.username_placeholder'),
            emailPlaceholder: t('signup.email_placeholder'),
            passwordPlaceholder: t('signup.password_placeholder'),
            submit: t('signup.submit'),
            haveAccount: t('signup.have_account'),
            logIn: t('signup.log_in')
        };
    }, [t, isInitialized]);

    const handleSubmit = useCallback(async(e) => {
        e.preventDefault();

        if (!canProceed || isLoading) {
            console.log('❌ Cannot submit - canProceed:', canProceed, 'isLoading:', isLoading);
            throw new Error(translations.cannotSubmit || 'Cannot submit');
        }
        
        console.log('🚀 Starting account creation...');
        setIsLoading(true);
        
        const data = {
            username,
            email,
            password
        }

        try {
            console.log('📤 Calling createAccount with data:', { username, email, password: '***' });
            const userId = await createAccount(data);
            console.log('✅ Account created successfully! User ID:', userId);

            // IMMEDIATELY disconnect Firebase listener to prevent it from triggering validation
            if (unsubscribeRef.current) {
                console.log('🔌 Disconnecting Firebase listener to prevent validation issues...');
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }

            // Set success state to prevent any further validation
            setIsSuccess(true);

            console.log('🍪 Setting session cookie...');
            setSessionCookie("adminLinker", `${userId}`, (60 * 5));
            
            console.log('🎉 Account creation completed, redirecting to dashboard...');
            
            // Use window.location for immediate redirect to prevent any React state issues
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 1500);
            
        } catch (error) {
            console.error('❌ Account creation failed:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            setIsLoading(false);
            setErrorMessage(translations.somethingWentWrong || 'Something went wrong');
            throw error; // Re-throw for toast to handle
        }
    }, [canProceed, isLoading, username, email, password, translations]);

    const createAccountHandler = useCallback((e) => {
        e.preventDefault();
        
        console.log('🎯 Form submitted, starting account creation process...');
        
        const promise = handleSubmit(e);
        
        toast.promise(
            promise,
            {
                loading: translations.settingUpAccount || 'Setting up account...',
                error: (error) => {
                    console.error('Toast error handler:', error);
                    return translations.couldNotComplete || 'Could not complete registration';
                },
                success: translations.setupComplete || 'Setup complete!',
            },
            {
                style: {
                    border: '1px solid #8129D9',
                    padding: '16px',
                    color: '#8129D9',
                },
                iconTheme: {
                    primary: '#8129D9',
                    secondary: '#FFFAEE',
                },
            }
        );
    }, [handleSubmit, translations]);

    // Initialize from session cookie only once
    useEffect(() => {
        if (!isInitializedRef.current) {
            const sessionUsername = getSessionCookie("username");
            if (sessionUsername) {
                setUsername(sessionUsername);
            }
            isInitializedRef.current = true;
        }
    }, []);

    // Fetch existing usernames and emails - WITH SUCCESS CHECK
    useEffect(() => {
        // Don't start listener if already successful
        if (isSuccess) return;
        
        if (unsubscribeRef.current) return; // Prevent multiple subscriptions

        console.log('🔥 Starting Firebase listener for validation...');
        const collectionRef = collection(fireApp, "accounts");
        
        const unsubscribe = onSnapshot(collectionRef, (querySnapshot) => {
            // Don't process updates if account creation was successful
            if (isSuccess) {
                console.log('⏹️ Ignoring Firebase update - account creation successful');
                return;
            }
            
            const usernames = [];
            const emails = [];
            
            querySnapshot.forEach((credential) => {
                const data = credential.data();
                if (data.username) {
                    usernames.push(String(data.username).toLowerCase());
                }
                if (data.email) {
                    emails.push(String(data.email).toLowerCase());
                }
            });
            
            console.log('📊 Firebase update - usernames:', usernames.length, 'emails:', emails.length);
            setExistingUsernames(usernames);
            setExistingEmail(emails);
        });

        unsubscribeRef.current = unsubscribe;
        
        // Cleanup function
        return () => {
            if (unsubscribeRef.current) {
                console.log('🧹 Cleaning up Firebase listener');
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [isSuccess]); // Add isSuccess as dependency

    // Username validation - WITH SUCCESS AND LOADING CHECKS
    useEffect(() => {
        // CRITICAL: Don't run any validation if successful or loading
        if (isSuccess || isLoading) {
            console.log('⏹️ Skipping username validation - success:', isSuccess, 'loading:', isLoading);
            return;
        }
        
        if (!isInitialized || !translations.usernameTaken) return;

        if (debouncedUsername === "") {
            setHasError((prev) => ({ ...prev, username: 0 }));
            return;
        }

        const lowerUsername = String(debouncedUsername).toLowerCase();
        
        if (existingUsernames.includes(lowerUsername)) {
            console.log('❌ Username validation failed - already exists');
            setHasError((prev) => ({ ...prev, username: 1 }));
            setErrorMessage(translations.usernameTaken);
            return;
        }

        if (debouncedUsername.length < 3) {
            console.log('❌ Username validation failed - too short');
            setHasError((prev) => ({ ...prev, username: 1 }));
            setErrorMessage(translations.usernameTooShort);
            return;
        }

        if (/[^a-zA-Z0-9\-_]/.test(debouncedUsername)) {
            console.log('❌ Username validation failed - invalid format');
            setHasError((prev) => ({ ...prev, username: 1 }));
            setErrorMessage(translations.invalidUsernameFormat);
            return;
        }

        console.log('✅ Username validation passed');
        setHasError((prev) => ({ ...prev, username: 2 }));
    }, [debouncedUsername, existingUsernames, translations, isInitialized, isSuccess, isLoading]);

    // Email validation - WITH SUCCESS AND LOADING CHECKS
    useEffect(() => {
        // CRITICAL: Don't run any validation if successful or loading
        if (isSuccess || isLoading) {
            console.log('⏹️ Skipping email validation - success:', isSuccess, 'loading:', isLoading);
            return;
        }
        
        if (!isInitialized || !translations.accountExists) return;

        if (debouncedEmail === "") {
            setHasError((prev) => ({ ...prev, email: 0 }));
            return;
        }

        const lowerEmail = String(debouncedEmail).toLowerCase();
        
        if (existingEmail.includes(lowerEmail)) {
            console.log('❌ Email validation failed - already exists');
            setHasError((prev) => ({ ...prev, email: 1 }));
            setErrorMessage(translations.accountExists);
            return;
        }

        if (!validateEmail(debouncedEmail)) {
            console.log('❌ Email validation failed - invalid format');
            setHasError((prev) => ({ ...prev, email: 1 }));
            setErrorMessage(translations.invalidEmailFormat);
            return;
        }

        console.log('✅ Email validation passed');
        setHasError((prev) => ({ ...prev, email: 2 }));
    }, [debouncedEmail, existingEmail, translations, isInitialized, isSuccess, isLoading]);

    // Password validation - WITH SUCCESS AND LOADING CHECKS
    useEffect(() => {
        // CRITICAL: Don't run any validation if successful or loading
        if (isSuccess || isLoading) {
            console.log('⏹️ Skipping password validation - success:', isSuccess, 'loading:', isLoading);
            return;
        }
        
        if (debouncedPassword === "") {
            setHasError((prev) => ({ ...prev, password: 0 }));
            return;
        }

        const passwordValidation = validatePassword(debouncedPassword);
        
        if (typeof passwordValidation !== "boolean") {
            console.log('❌ Password validation failed');
            setHasError((prev) => ({ ...prev, password: 1 }));
            setErrorMessage(passwordValidation);
            return;
        }

        console.log('✅ Password validation passed');
        setHasError((prev) => ({ ...prev, password: 2 }));
    }, [debouncedPassword, isSuccess, isLoading]);

    // Can proceed validation - WITH SUCCESS AND LOADING CHECKS
    useEffect(() => {
        // Don't change canProceed if successful or loading
        if (isSuccess || isLoading) {
            console.log('⏹️ Skipping canProceed check - success:', isSuccess, 'loading:', isLoading);
            return;
        }
        
        const allValid = hasError.email === 2 && hasError.username === 2 && hasError.password === 2;
        console.log('🎯 canProceed check - allValid:', allValid, 'hasError:', hasError);
        setCanProceed(allValid);
        
        if (allValid) {
            setErrorMessage("");
        }
    }, [hasError, isSuccess, isLoading]);

    // Don't render until translations are loaded
    if (!isInitialized) {
        return (
            <div className="flex-1 sm:p-12 py-8 p-2 flex flex-col overflow-y-auto">
                <div className="flex justify-center items-center h-full">
                    <div>Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 sm:p-12 py-8 p-2 flex flex-col overflow-y-auto">
            <Link href={'/'} className="sm:p-0 p-3 w-fit">
                <Image priority src={"https://linktree.sirv.com/Images/full-logo.svg"} alt="logo" height={150} width={100} className="w-[7.05rem]" />
            </Link>
            <section className="mx-auto py-10 w-full sm:w-5/6 md:w-3/4 lg:w-2/3 xl:w-1/2 flex-1 flex flex-col justify-center">
                <p className="text-2xl sm:text-5xl font-extrabold text-center">{translations.title}</p>
                <form className="py-8 sm:py-12 flex flex-col gap-4 sm:gap-6 w-full" onSubmit={createAccountHandler}>
                    <div className={`flex items-center py-2 sm:py-3 px-2 sm:px-6 rounded-md myInput ${
                        isSuccess ? "good" : // Always show green if successful
                        hasError.username === 1 ? "hasError" : 
                        hasError.username === 2 ? "good" : ""
                    } bg-black bg-opacity-5 text-base sm:text-lg w-full`}>
                        <label className="opacity-40">tapit.fr/</label>
                        <input
                            type="text"
                            placeholder={translations.usernamePlaceholder}
                            className="outline-none border-none bg-transparent ml-1 py-3 flex-1 text-sm sm:text-base"
                            value={username}
                            onChange={(e) => !isLoading && !isSuccess && setUsername(e.target.value)}
                            required
                            disabled={isLoading || isSuccess}
                        />
                        {isSuccess ?
                            <FaCheck className="text-themeGreen cursor-pointer" />
                            :
                            hasError.username === 1 ?
                                <FaX className="text-red-500 text-sm cursor-pointer" onClick={() => !isLoading && setUsername("")} />
                                :
                                hasError.username === 2 ?
                                    <FaCheck className="text-themeGreen cursor-pointer" />
                                    :
                                    ""
                        }
                    </div>
                    <div className={`flex items-center py-2 sm:py-3 px-2 sm:px-6 rounded-md myInput ${
                        isSuccess ? "good" : // Always show green if successful
                        hasError.email === 1 ? "hasError" : 
                        hasError.email === 2 ? "good" : ""
                    } bg-black bg-opacity-5 text-base sm:text-lg w-full`}>
                        <input
                            type="text"
                            placeholder={translations.emailPlaceholder}
                            className="outline-none border-none bg-transparent ml-1 py-3 flex-1 text-sm sm:text-base"
                            value={email}
                            onChange={(e) => !isLoading && !isSuccess && setEmail(e.target.value)}
                            required
                            disabled={isLoading || isSuccess}
                        />
                        {isSuccess ?
                            <FaCheck className="text-themeGreen cursor-pointer" />
                            :
                            hasError.email === 1 ?
                                <FaX className="text-red-500 text-sm cursor-pointer" onClick={() => !isLoading && setEmail("")} />
                                :
                                hasError.email === 2 ?
                                    <FaCheck className="text-themeGreen cursor-pointer" />
                                    :
                                    ""
                        }
                    </div>
                    <div className={`flex items-center relative py-2 sm:py-3 px-2 sm:px-6 rounded-md ${
                        isSuccess ? "good" : // Always show green if successful
                        hasError.password === 1 ? "hasError" : 
                        hasError.password === 2 ? "good" : ""
                    } bg-black bg-opacity-5 text-base sm:text-lg myInput`}>
                        <input
                            type={`${seePassord ? "password" : "text"}`}
                            placeholder={translations.passwordPlaceholder}
                            className="peer outline-none border-none bg-transparent py-3 ml-1 flex-1 text-sm sm:text-base"
                            value={password}
                            onChange={(e) => !isLoading && !isSuccess && setPassword(e.target.value)}
                            required
                            disabled={isLoading || isSuccess}
                        />
                        {seePassord && <FaEyeSlash className={`opacity-60 cursor-pointer ${isLoading || isSuccess ? 'pointer-events-none' : ''}`} onClick={() => !isLoading && !isSuccess && setSeePassord(!seePassord)} />}
                        {!seePassord && <FaEye className={`opacity-60 cursor-pointer text-themeGreen ${isLoading || isSuccess ? 'pointer-events-none' : ''}`} onClick={() => !isLoading && !isSuccess && setSeePassord(!seePassord)} />}
                    </div>
                    
                    {isSuccess ? (
                        <div className="rounded-md py-4 sm:py-5 grid place-items-center font-semibold bg-themeGreen text-white">
                            <div className="flex items-center gap-2">
                                <FaCheck />
                                <span>Account Created Successfully!</span>
                            </div>
                        </div>
                    ) : (
                        <button 
                            type="submit" 
                            disabled={!canProceed || isLoading}
                            className={
                                `rounded-md py-4 sm:py-5 grid place-items-center font-semibold transition-all duration-200 ${
                                    canProceed && !isLoading 
                                        ? "cursor-pointer active:scale-95 active:opacity-40 hover:scale-[1.025] bg-themeGreen mix-blend-screen" 
                                        : "cursor-default opacity-50"
                                }`
                            }
                        >
                            {!isLoading && <span className="nopointer">{translations.submit}</span>}
                            {isLoading && <Image src={"https://linktree.sirv.com/Images/gif/loading.gif"} width={25} height={25} alt="loading" className="mix-blend-screen" />}
                        </button>
                    )}

                    {!isLoading && !isSuccess && errorMessage && <span className="text-sm text-red-500 text-center">{errorMessage}</span>}
                </form>
                <p className="text-center"><span className="opacity-60">{translations.haveAccount}</span> <Link className="text-themeGreen" href={"/login"}>{translations.logIn}</Link> </p>
            </section>
        </div>
    )
}