// src/components/Contacts.jsx
import React from 'react';

const Contacts = () => {
  const contactData = [
    {
      title: 'Location HQ',
      primaryText: "Ngong' Road, Corner",
      subText: 'Nairobi, Kenya',
      accent: 'border-l-4 border-l-[#CC0000]'
    },
    {
      title: 'Service Desk',
      primaryText: '+254 700 000 000',
      subText: 'Mon - Sat: 08:00 - 18:00',
      accent: 'border-l-4 border-l-slate-900'
    },
    {
      title: 'Digital Support',
      primaryText: 'support@autocare.pro',
      subText: '24/7 Portal Response System',
      accent: 'border-l-4 border-l-gray-400'
    }
  ];

  return (
    <section id="contacts" className="bg-slate-50 text-slate-900 py-24 px-6 md:px-12 lg:px-24 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-[2px] bg-[#CC0000]"></div>
            <span className="uppercase tracking-[0.3em] text-[#CC0000] font-black text-xs">Get In Touch</span>
            <div className="w-6 h-[2px] bg-[#CC0000]"></div>
          </div>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-950">
            We are always within reach
          </h2>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {contactData.map((contact, index) => (
            <div 
              key={index} 
              className={`p-10 bg-white border border-slate-200/60 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-b from-white to-slate-50/50 ${contact.accent}`}
            >
              <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#CC0000] mb-6">
                {contact.title}
              </h3>
              <p className="text-xl font-extrabold text-slate-950 mb-2 group-hover:text-[#CC0000] transition-colors duration-300">
                {contact.primaryText}
              </p>
              <p className="text-slate-500 text-sm font-medium">
                {contact.subText}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Contacts;