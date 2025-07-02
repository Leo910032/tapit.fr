"use client"
//tapit.fr/app/dashboard/general components (main) $ ls CheckSession.jsx 
import { getSessionCookie } from "@/lib/authentication/session";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CheckSession() {
    const router = useRouter();
    
    useEffect(() => {
        const sessionUsername = getSessionCookie("adminLinker");
        if (sessionUsername !== undefined) {
            return;
        }

        router.push("/login");
    }, [router]);
}