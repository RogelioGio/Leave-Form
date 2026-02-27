import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Completed from "./Completed";
import Leave_Form from "./Leave_Form";
import { Badge, BadgeCheck, FileCheck, FileInput, FileX } from "lucide-react";

function App() {
  const [requestStatus, setRequestStatus] = useState("rejected"); // "submitted", "approved", "rejected"
  return (
    <>
        {
          requestStatus === "forApproval" ? 
          <div className="bg-white rounded-lg w-fit p-10 mx-auto mt-20 animate-slideIn">
              <div>
                  <FileInput className="text-yellow-500 mx-auto mb-5" size={100} />
              </div>
              <div>
                  <h1 className="text-2xl font-bold text-center">Waiting for Approval</h1>
                  <p className="text-center mt-2 text-sm text-gray-500">Your application is sent to your supervisor and waiting for thier response
                    <br /> We will notify you once we receive a response from your supervisor.</p>
              </div>
          </div> : 
          requestStatus === "approved" ?
          <div className="bg-white rounded-lg w-fit p-10 mx-auto mt-20 animate-slideIn">
              <div>
                  <FileCheck className="text-green-900 mx-auto mb-5" size={100} />
              </div>
              <div>
                  <h1 className="text-2xl font-bold text-center">Approved</h1>
                  <p className="text-center mt-2 text-sm text-gray-500">Your application is approved by your supervisor.
                    <br /> You may now proceed with your leave.</p>
              </div>
          </div> :
          requestStatus === "rejected" ?
          <div className="bg-white rounded-lg w-fit p-10 mx-auto mt-20 animate-slideIn">
              <div>
                  <FileX className="text-red-500 mx-auto mb-5" size={100} />
              </div>
              <div>
                  <h1 className="text-2xl font-bold text-center">Rejected</h1>
                  <p className="text-center mt-2 text-sm text-gray-500">Your application is rejected by your supervisor.
                    <br /> You may contact your supervisor for more details.</p>
              </div>
          </div> :
          requestStatus === "applying" 
          ? <Completed /> 
          : <Leave_Form setRequestStatus={setRequestStatus} />
        }
      {/* {submitted ? <Completed /> : <Leave_Form setSubmitted={setSubmitted} />} */}
    </>
  );
}

export default App;
