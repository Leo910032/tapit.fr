// app/nfc-cards/login/page.jsx
import { Toaster } from "react-hot-toast";
import NFCLoginForm from "./components/NFCLoginForm";
import SideThing from "@/app/components/General Components/SideThing";

export const generateMetadata = () => {
    return {
        title: "TapIt | Login for NFC Cards",
        description: "Log into your account to purchase NFC cards"
    }
}

export default function NFCLoginPage() {
    return (
        <div className="flex h-screen w-screen">
            <Toaster />
            <NFCLoginForm />
            <SideThing />
        </div>
    );
}