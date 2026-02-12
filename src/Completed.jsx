import { Badge, BadgeCheck } from "lucide-react";

export default function Completed() {
    return <>
        <div className="bg-white rounded-lg w-fit p-10 mx-auto mt-20 animate-slideIn">
            <div>
                <BadgeCheck className="text-green-900 mx-auto mb-5" size={100} />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-center">Request Submitted!</h1>
                <p className="text-center mt-2 text-sm text-gray-500">Thank you for submitting the form. We will review your <br /> submission and get back to you shortly.</p>
            </div>
        </div>
    </>
}
