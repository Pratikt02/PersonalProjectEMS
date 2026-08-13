import React, { useState, useEffect } from "react";

const EditProfileModal = ({ isOpen, onClose, emp, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    email: "",
    phone: "",
    joining_date: "",
    department: "",
    designation: "",
    location: "",
    dob: "",
    gender: "",
  });

  useEffect(() => {
    if (emp) {
      setFormData({
        name: emp.name || "",
        employeeId: emp.employeeId || "",
        email: emp.email || "",
        phone: emp.phone || "",
        joining_date: emp.joining_date ? emp.joining_date.split('T')[0] : "",
        department: emp.department || "",
        designation: emp.designation || "",
        location: emp.location || "",
        dob: emp.dob ? emp.dob.split('T')[0] : "",
        gender: emp.gender || "",
      });
    }
  }, [emp]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitHandler = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-100 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        
        {/* Modal Header */}
        <div className="px-10 py-8 bg-linear-to-r from-blue-600 to-blue-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white tracking-tight mb-1">Modify Profile Attributes</h2>
            <p className="text-blue-100/70 text-[10px] font-bold uppercase tracking-[0.2em]">Enterprise Resource Identity Editor</p>
          </div>
        </div>

        <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Identity Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
               <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Identity</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Resource ID</label>
                <input 
                  type="text" 
                  name="employeeId"
                  value={formData.employeeId} 
                  className="erp-input bg-slate-50 border-slate-200 text-slate-400 font-mono" 
                  readOnly 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Legal Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  className="erp-input shadow-xs" 
                />
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  className="erp-input shadow-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Uplink</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  className="erp-input shadow-xs" 
                />
              </div>
            </div>
          </section>

          {/* Org Section */}
          <section className="space-y-4 pt-4 border-t border-slate-100">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Department</label>
                <input 
                  type="text" 
                  name="department" 
                  value={formData.department} 
                  onChange={handleChange} 
                  className="erp-input shadow-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Official Designation</label>
                <input 
                  type="text" 
                  name="designation" 
                  value={formData.designation} 
                  onChange={handleChange} 
                  className="erp-input shadow-xs" 
                />
              </div>
            </div>
          </section>

          {/* Bio Data Section */}
          <section className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Resource DOB</label>
                <input 
                  type="date" 
                  name="dob" 
                  value={formData.dob} 
                  onChange={handleChange} 
                  className="erp-input shadow-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Resource Gender</label>
                <select 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange} 
                  className="erp-input shadow-xs bg-white"
                >
                  <option value="">Select Identity</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </section>

          {/* Location Section */}
          <section className="space-y-4 pt-4 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Primary Work Location</label>
              <input 
                type="text" 
                name="location" 
                value={formData.location} 
                onChange={handleChange} 
                className="erp-input shadow-xs" 
              />
            </div>
          </section>

        </div>

        {/* Modal Footer */}
        <div className="px-10 py-8 bg-slate-50 border-t border-slate-200 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl bg-white border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
          >
            Abort Changes
          </button>
          <button
            onClick={submitHandler}
            className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            Commit Modifications
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;














// import React, { useState, useEffect } from "react";

// const EditProfileModal = ({ isOpen, onClose, emp, onSave }) => {
//   const [formData, setFormData] = useState({
//     name: "",
//     employeeId: "",
//     email: "",
//     phone: "",
//     joining_date: "",
//     department: "",
//     designation: "",
//     location: "",
//     dob: "",
//     gender: "",
//   });

//   useEffect(() => {
//     if (emp) {
//       setFormData({
//         name: emp.name || "",
//         employeeId: emp.employeeId || "",
//         email: emp.email || "",
//         phone: emp.phone || "",
//         joining_date: emp.joining_date || "",
//         department: emp.department || "",
//         designation: emp.designation || "",
//         location: emp.location || "",
//         dob: emp.dob || "",
//         gender: emp.gender || "",
//       });
//     }
//   }, [emp]);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const submitHandler = () => {
//     onSave(formData);
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
//       <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl space-y-6">
//         <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">
//           Edit Profile
//         </h2>

//         {/* EMPLOYEE ID */}
//         <div>
//           <label className="font-semibold">Employee ID</label>
//           <input 
//             type="text" 
//             name="employeeId"
//             value={formData.employeeId} 
//             onChange={handleChange}
//             className="w-full p-3 bg-gray-200 rounded" 
//             readOnly 
//           />
//         </div>

//         {/* FULL NAME + EMAIL */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <label className="font-semibold">Full Name</label>
//             <input 
//               type="text" 
//               name="name" 
//               value={formData.name} 
//               onChange={handleChange} 
//               className="w-full p-3 border rounded" 
//             />
//           </div>
//           <div>
//             <label className="font-semibold">Email</label>
//             <input 
//               type="email" 
//               name="email" 
//               value={formData.email} 
//               onChange={handleChange} 
//               className="w-full p-3 border rounded" 
//             />
//           </div>
//         </div>

//         {/* PHONE + GENDER */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <label className="font-semibold">Phone Number</label>
//             <input 
//               type="text" 
//               name="phone" 
//               value={formData.phone} 
//               onChange={handleChange} 
//               className="w-full p-3 border rounded" 
//             />
//           </div>
//           <div>
//             <label className="font-semibold">Gender</label>
//             <select 
//               name="gender" 
//               value={formData.gender} 
//               onChange={handleChange} 
//               className="w-full p-3 border rounded bg-white"
//             >
//               <option value="">Select gender</option>
//               <option value="Male">Male</option>
//               <option value="Female">Female</option>
//               <option value="Other">Other</option>
//             </select>
//           </div>
//         </div>

//         {/* DOB + Date of Joining */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <label className="font-semibold">Date of Birth</label>
//             <input 
//               type="date" 
//               name="dob" 
//               value={formData.dob} 
//               onChange={handleChange} 
//               className="w-full p-3 border rounded" 
//             />
//           </div>
//           <div>
//             <label className="font-semibold">Date of Joining</label>
//             <input 
//               type="date" 
//               name="joining_date" 
//               value={formData.joining_date} 
//               onChange={handleChange} 
//               className="w-full p-3 border rounded" 
//             />
//           </div>
//         </div>

//         {/* DEPARTMENT + DESIGNATION */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <label className="font-semibold">Department</label>
//             <input 
//               type="text" 
//               name="department" 
//               value={formData.department} 
//               onChange={handleChange} 
//               className="w-full p-3 border rounded" 
//             />
//           </div>
//           <div>
//             <label className="font-semibold">Designation</label>
//             <input 
//               type="text" 
//               name="designation" 
//               value={formData.designation} 
//               onChange={handleChange} 
//               className="w-full p-3 border rounded" 
//             />
//           </div>
//         </div>

//         {/* LOCATION */}
//         <div>
//           <label className="font-semibold">Location</label>
//           <input 
//             type="text" 
//             name="location" 
//             value={formData.location} 
//             onChange={handleChange} 
//             className="w-full p-3 border rounded" 
//           />
//         </div>

//         <div className="flex gap-4">
//           <button
//             onClick={submitHandler}
//             className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
//           >
//             Save Changes
//           </button>
//           <button
//             onClick={onClose}
//             className="flex-1 bg-white text-blue-600 border-2 border-blue-600 font-semibold py-3 rounded-lg hover:bg-blue-50 transition"
//           >
//             Cancel
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EditProfileModal;