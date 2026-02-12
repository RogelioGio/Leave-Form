import { useState } from "react";
import App from "./App";

export default function Layout() {
    const [submitted, setSubmitted] = useState(false)

    return (
        <div className="w-screen min-h-screen h-full bg-[url('https://d2zbzumnfle0rf.cloudfront.net/assets/uploads/63c34a7c6bd2f-LRA-office.png')] bg-cover bg-center">
            <div className="w-full min-h-screen h-full bg-gray-900/50 backdrop-blur-sm flex items-center justify-center md:p-10 p-5">
                <App/>
            </div>
        </div>
    )
}