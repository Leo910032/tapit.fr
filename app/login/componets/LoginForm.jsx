// app/login/componets/LoginForm.jsx
"use client"
import { useDebounce } from "@/LocalHooks/useDebounce";
import { fireApp } from "@/important/firebase";
import { loginAccount } from "@/lib/authentication/login";
import { setSessionCookie } from "@/lib/authentication/session";
import { useTranslation } from "@/lib/useTranslation";
import { collection, onSnapshot } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa6";

export default function LoginForm() {
    const router = useRouter();
    const { t } = useTranslation();
    
    const [seePassword, setSeePassword] = useState(true);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [canProceed, setCanProceed] = useState(false);
    const [existingUsernames, setExistingUsernames] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const debouncedUsername = useDebounce(username, 500);
    const debouncedPassword = useDebounce(password, 500);

    const handleLogin = async(e) => {
        e.preventDefault();

        if (!canProceed || isLoading) {
            return;
        }
        
        setIsLoading(true);
        const data = {
            log_username: username,
            log_password: password
        }

        try {
            const userId = await loginAccount(data);
            setSessionCookie("adminLinker", `${userId}`, (60 * 60));
            setTimeout(() => {
                router.push("/dashboard");
            }, 1000);
        } catch (error) {
            setIsLoading(false);
            setCanProceed(false);
            if (existingUsernames.includes(String(username).toLowerCase())) {
                setErrorMessage(t('login.incorrect_password'));
            } else {
                setErrorMessage(t('login.username_not_registered'));
            }
        }
    }

    const loginHandler = (e) => {
        e.preventDefault();
        const promise = handleLogin(e);
        toast.promise(
            promise,
            {
                loading: t('login.validating'),
                error: t('login.invalid_credentials'),
                success: t('login.success'),
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
        )
    }

    useEffect(() => {
        function fetchExistingUsername() {
            const existingUsernames = [];
        
            const collectionRef = collection(fireApp, "accounts");
        
            onSnapshot(collectionRef, (querySnapshot) => {
                querySnapshot.forEach((credential) => {
                    const data = credential.data();
                    const { username } = data;
                    existingUsernames.push(String(username).toLowerCase());
                });
                
                setExistingUsernames(existingUsernames);
            });
        }

        fetchExistingUsername();
    }, []);

    useEffect(() => {
        if (username !== "" && password !== "") {
            setCanProceed(true);
            setErrorMessage("");
        } else {
            setCanProceed(false);
        }
    }, [debouncedUsername, debouncedPassword]);

    return (
        <div className="flex-1 sm:p-12 px-4 py-8 flex flex-col overflow-y-auto">
            <Link href={'/'} className="sm:p-0 p-3">
                <Image src={"https://linktree.sirv.com/Images/full-logo.svg"} alt="logo" height={150} width={100} className="w-[7.05rem]" />
            </Link>
            <section className="mx-auto py-10 w-full sm:w-5/6 md:w-3/4 lg:w-2/3 xl:w-1/2 flex-1 flex flex-col justify-center">
                <p className="text-2xl sm:text-5xl md:text-3xl font-extrabold text-center">{t('login.title')}</p>
                <form className="py-8 sm:py-12 flex flex-col gap-4 sm:gap-6 w-full" onSubmit={loginHandler}>
                    <div className="flex items-center py-2 sm:py-3 px-2 sm:px-6 rounded-md myInput bg-black bg-opacity-5 text-base sm:text-lg w-full">
                        <input
                            type="text"
                            placeholder={t('login.username_placeholder')}
                            className="outline-none border-none bg-transparent ml-1 py-3 flex-1 text-sm sm:text-base"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex items-center relative py-2 sm:py-3 px-2 sm:px-6 rounded-md bg-black bg-opacity-5 text-base sm:text-lg myInput">
                        <input
                            type={`${seePassword ? "password" : "text"}`}
                            placeholder={t('login.password_placeholder')}
                            className="peer outline-none border-none bg-transparent py-3 ml-1 flex-1 text-sm sm:text-base"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {seePassword && <FaEyeSlash className="opacity-60 cursor-pointer" onClick={() => setSeePassword(!seePassword)} />}
                        {!seePassword && <FaEye className="opacity-60 cursor-pointer text-themeGreen" onClick={() => setSeePassword(!seePassword)} />}
                    </div>

                    <Link href={"/forgot-password"} className="w-fit hover:rotate-2 hover:text-themeGreen origin-left">{t('login.forgot_password')}</Link>

                    <button type="submit" className={
                        `rounded-md py-4 sm:py-5 grid place-items-center font-semibold ${canProceed? "cursor-pointer active:scale-95 active:opacity-40 hover:scale-[1.025] bg-themeGreen mix-blend-screen" : "cursor-default opacity-50 "}`
                    }>
                        {!isLoading && <span className="nopointer">{t('login.submit')}</span>}
                        {isLoading && <Image src={"https://linktree.sirv.com/Images/gif/loading.gif"} width={25} height={25} alt="loading" className=" mix-blend-screen" />}
                    </button>

                    {!isLoading && <span className="text-sm text-red-500 text-center">{errorMessage}</span>}
                </form>
                <p className="text-center sm:text-base text-sm"><span className="opacity-60">{t('login.no_account')}</span> <Link href={"/signup"} className="text-themeGreen">{t('login.sign_up')}</Link> </p>
            </section>
        </div>
    )
}