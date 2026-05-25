// src/components/CustomerProfile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, Lock } from "lucide-react";

const CustomerProfile = () => {
    const navigate = useNavigate();
    const customerId = localStorage.getItem("customer_id") || localStorage.getItem("customerID");

    const [profile, setProfile] = useState({ fullName: "", email: "", phone: "" });
    const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });
    const [originalProfile, setOriginalProfile] = useState({});
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("authToken");
                const res = await fetch(`http://127.0.0.1:5000/api/customer/profile/${customerId}`, {
                    headers: { "Authorization": `Bearer ${token}` } 
                });
                const data = await res.json();
                
                const formattedData = {
                    fullName: data.FullName || "",
                    email: data.Email || "",
                    phone: data.PhoneNumber || ""
                };
                setProfile(formattedData);
                setOriginalProfile(formattedData);
            } catch (err) {
                console.error("Profile fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        if (customerId) fetchProfile();
    }, [customerId]);

    const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
    const handlePasswordChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });
    
    const handleCancel = () => { 
        setProfile(originalProfile); 
        setPasswords({ newPassword: "", confirmPassword: "" });
        setEditing(false); 
    };

    const handleSave = async () => {
        if (passwords.newPassword && passwords.newPassword !== passwords.confirmPassword) {
            alert("New passwords do not match!");
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem("authToken");
            const payload = { 
                FullName: profile.fullName,
                Email: profile.email,
                PhoneNumber: profile.phone
            };
            if (passwords.newPassword) payload.newPassword = passwords.newPassword;

            const res = await fetch(`http://127.0.0.1:5000/api/customer/profile/${customerId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                localStorage.setItem("userName", profile.fullName);
                localStorage.setItem("phone", profile.phone);
                setOriginalProfile(profile);
                setPasswords({ newPassword: "", confirmPassword: "" });
                setEditing(false);
                alert(passwords.newPassword ? "Profile and password updated successfully!" : "Profile updated successfully!");
            } else {
                const data = await res.json();
                alert(data.message || data.error || "Failed to update profile.");
            }
        } catch (err) {
            console.error("Update error:", err);
            alert("Could not connect to server.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-zinc-400 text-sm py-32 text-center tracking-widest font-bold uppercase animate-pulse">Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 antialiased">
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl relative">
                
                {/* HEADER HERO BANNER */}
                <div className="relative h-52 bg-gradient-to-r from-[#CC0000] via-red-900 to-zinc-950">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="absolute top-6 left-6 w-11 h-11 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-sm transition-all duration-200 flex items-center justify-center text-white border border-white/10"
                        title="Go Back"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <div className="absolute top-6 right-6 flex gap-3">
                        {!editing ? (
                            <button 
                                onClick={() => setEditing(true)} 
                                className="px-5 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all text-white text-xs font-bold uppercase tracking-wider border border-white/10 flex items-center gap-2"
                            >
                                ✎ Edit Profile
                            </button>
                        ) : (
                            <>
                                <button onClick={handleCancel} className="w-11 h-11 rounded-full bg-zinc-900 hover:bg-zinc-800 transition flex items-center justify-center text-zinc-400 hover:text-white border border-zinc-800" title="Cancel">
                                    ✕
                                </button>
                                <button onClick={handleSave} disabled={saving} className="px-6 h-11 rounded-full bg-[#CC0000] hover:bg-red-700 transition text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 shadow-lg">
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </>
                        )}
                    </div>
                    
                    {/* AVATAR BADGE */}
                    <div className="absolute -bottom-16 left-10">
                        <div className="w-32 h-32 rounded-full bg-zinc-900 border-4 border-zinc-950 flex items-center justify-center text-4xl font-black text-white shadow-2xl tracking-tighter">
                            {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : "C"}
                        </div>
                    </div>
                </div>

                {/* PROFILE CONTENT MAT */}
                <div className="pt-24 px-6 md:px-12 pb-12">
                    <div className="mb-10">
                        {editing ? (
                            <div className="relative">
                                <input 
                                    type="text" 
                                    name="fullName" 
                                    value={profile.fullName} 
                                    onChange={handleChange} 
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xl font-bold text-white outline-none focus:border-[#CC0000] transition duration-300" 
                                    placeholder="Full Name" 
                                />
                            </div>
                        ) : (
                            <>
                                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                                    {profile.fullName || "Customer Name"}
                                </h1>
                                <p className="text-zinc-500 mt-2 text-[10px] uppercase tracking-[0.25em] font-black">Verified Member Account</p>
                            </>
                        )}
                    </div>

                    {/* FIELDS GRID */}
                    <div className="grid md:grid-cols-2 gap-6">
                        
                        {/* Email box */}
                        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-5 relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-3">
                                <Mail size={14} className="text-zinc-600" />
                                <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-black">Email Address</span>
                            </div>
                            {editing ? (
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={profile.email} 
                                    onChange={handleChange} 
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white outline-none focus:border-[#CC0000] transition duration-300" 
                                />
                            ) : (
                                <h3 className="text-base font-semibold text-zinc-200 break-all">{profile.email || "No Email Registered"}</h3>
                            )}
                        </div>

                        {/* Phone box */}
                        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-5 relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-3">
                                <Phone size={14} className="text-zinc-600" />
                                <span className="text-zinc-500 text-[10px] uppercase tracking-wider font-black">Phone Number</span>
                            </div>
                            {editing ? (
                                <input 
                                    type="text" 
                                    name="phone" 
                                    value={profile.phone} 
                                    onChange={handleChange} 
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white outline-none focus:border-[#CC0000] transition duration-300" 
                                />
                            ) : (
                                <h3 className="text-base font-semibold text-zinc-200">{profile.phone || "No Phone Number"}</h3>
                            )}
                        </div>
                    </div>

                    {/* SECURE PASSWORD PANELS */}
                    {editing && (
                        <div className="mt-8 border-t border-zinc-900 pt-8 animate-fadeIn">
                            <div className="flex items-center gap-2 mb-4">
                                <Lock size={14} className="text-zinc-500" />
                                <span className="text-zinc-400 text-[10px] uppercase tracking-wider font-black">Update Security Credentials</span>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <input 
                                    type="password" 
                                    name="newPassword" 
                                    value={passwords.newPassword} 
                                    onChange={handlePasswordChange} 
                                    placeholder="New Password Key"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 text-sm text-white outline-none focus:border-[#CC0000] transition duration-300" 
                                />
                                <input 
                                    type="password" 
                                    name="confirmPassword" 
                                    value={passwords.confirmPassword} 
                                    onChange={handlePasswordChange} 
                                    placeholder="Confirm New Password Key"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 text-sm text-white outline-none focus:border-[#CC0000] transition duration-300" 
                                />
                            </div>
                            <p className="text-zinc-600 text-xs mt-4 font-medium italic">
                              Leave fields blank to keep current system password security keys unchanged.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerProfile;