import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate(); // FIX: Added router navigation

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const res = await fetch(`http://127.0.0.1:5000/api/verify-email/${token}`);
                const data = await res.json();
                
                alert(data.message);
                
                // FIX: Navigate to login so the user isn't stuck on a blank screen
                navigate("/login"); 
            } catch (error) {
                console.log("Verification Error:", error);
                alert("An error occurred during verification. Please try again.");
                navigate("/login");
            }
        };

        verifyEmail();
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-white p-10 font-bold tracking-widest uppercase">
                <span className="animate-pulse">Verifying Email...</span>
            </div>
        </div>
    );
};

export default VerifyEmail;