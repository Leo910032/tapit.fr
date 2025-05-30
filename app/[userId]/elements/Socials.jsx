import { useSocialsList } from "@/lib/SocialsList";
import { isSuitableForWhiteText } from "@/lib/utilities";
import Image from "next/image";
import Link from "next/link";

export default function Socials({ socialArray, themeFontColor }) {
    const SocialsList = useSocialsList(); // Use the translated hook

    return (
        <div className="flex gap-2 justify-center flex-wrap max-w-full sArray">
            {socialArray.map((social, index) => {
                if (social.active) {
                    // Find the social data using the type
                    const socialData = SocialsList.find(s => s.type === social.type);
                    
                    if (!socialData) {
                        return null; // Skip if social data not found
                    }

                    return (
                        <Link
                            key={index}
                            href={socialData.valueType !== "url" ? `${socialData.baseUrl}${social.value}` : social.value}
                            target="_blank"
                            className={`hover:scale-[1.25] active:scale-95 min-w-fit sIcon ${isSuitableForWhiteText(themeFontColor) ? "filter invert" : ""}`}
                        >
                            <Image 
                                src={socialData.icon} 
                                alt={socialData.title} 
                                width={40} 
                                height={40} 
                                style={{ filter: "drop-shadow(inset 0 0 10px #fff)" }} 
                            />
                        </Link>
                    )
                }
            })}
        </div>
    );
}