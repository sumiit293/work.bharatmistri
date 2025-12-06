"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import api from "./api";

type Step = 1 | 2 | 3;

type FormValues = {
  name: string;
  primaryMobileNumber: string;
  otp?: string;
  category?: string;
  skillsText?: string;
  experience?: string;
  verificationConfirmed?: boolean;
};

export default function RegistrationForm() {
  const [step, setStep] = useState<Step>(1);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpAttempted, setOtpAttempted] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, setError, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: "",
      primaryMobileNumber: "",
      otp: "",
      category: "",
      skillsText: "",
      experience: "",
      verificationConfirmed: false,
    }
  });

  const watchedMobile = watch("primaryMobileNumber");

  // Reset OTP verification if mobile number changes
  React.useEffect(() => {
    setOtpVerified(false);
    setStatusMessage(null);
  }, [watchedMobile]);

  // Load technician categories once on mount
  React.useEffect(() => {
    let mounted = true;
    async function load() {
      setCategoriesLoading(true);
      setCategoriesError(null);
      const res = await api.getTechnicianCategoryList?.();
      if (!mounted) return;
      setCategoriesLoading(false);
      if (!res) {
        setCategoriesError("No response from category API");
        return;
      }
      if (!res.success) {
        setCategoriesError(res.error || "Failed to load categories");
        return;
      }
      setCategories(res.data || []);
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function onCreateBasic(details: FormValues) {
    // Step 1 submit
    if (!details.name || details.name.trim().length < 2) {
      setError("name", { type: "manual", message: "Name must be at least 2 characters" });
      return;
    }
    if (!/^[0-9]{10}$/.test(details.primaryMobileNumber || "")) {
      setError("primaryMobileNumber", { type: "manual", message: "Enter valid 10-digit mobile number" });
      return;
    }
    setSubmitting(true);
    setStatusMessage(null);
    const res = await api.createBasicDetails(details.name, details.primaryMobileNumber || "");
    setSubmitting(false);
    if (!res.success) {
      setMessageType('error');
      setStatusMessage(res.error || "Failed to create record");
      return;
    }
    // try to find id in response
    const id = res.data?.data?._id || res.data?._id || res.data?.data?.id || res.data?.id;
    setRecordId(id || null);
    setStep(2);
  }

  async function handleSendOtp() {
    setOtpAttempted(true);
    setStatusMessage(null);
    if (!/^[0-9]{10}$/.test(watchedMobile || "")) {
      setError("primaryMobileNumber", { type: "manual", message: "Enter valid 10-digit mobile number" });
      return;
    }
    const res = await api.sendOtp(watchedMobile || "");
    if (res.success) {
      setMessageType('success');
      setStatusMessage("OTP sent");
    } else {
      setMessageType('error');
      setStatusMessage(res.error || "Failed to send OTP");
    }
  }

  async function handleVerifyOtp(otp?: string) {
    setStatusMessage(null);
    if (!otp || !/^[0-9]{4,6}$/.test(otp)) {
      setMessageType('error');
      setStatusMessage("Enter a valid OTP");
      return;
    }
    const res = await api.verifyOtp(watchedMobile || "", Number(otp));
    if (res.success) {
      setMessageType('success');
      setStatusMessage("OTP verified");
      setOtpVerified(true);
    } else {
      setMessageType('error');
      setStatusMessage(res.error || "Invalid OTP");
      setOtpVerified(false);
    }
  }

  async function onStep2Submit(values: FormValues) {
    if (!recordId) { setStatusMessage("Missing record id"); return; }
    if (!values.category) { setError("category", { type: "manual", message: "Category required" }); return; }
    if (!values.skillsText || values.skillsText.trim().length === 0) { setError("skillsText", { type: "manual", message: "Provide at least one skill" }); return; }
    if (!values.experience) { setError("experience", { type: "manual", message: "Experience required" }); return; }
    setSubmitting(true);
    const skills = (values.skillsText || "").split(",").map(s => s.trim()).filter(Boolean);
    const res = await api.updateSkillsCategory(recordId, { category: values.category, skills, experience: values.experience });
    setSubmitting(false);
    if (!res.success) { setStatusMessage(res.error || "Failed to update"); return; }
    setStep(3);
  }

  function handleFilesChange(files: FileList | null) {
    // Removed - step 3 photo upload removed
    return;
  }

  async function onStep3Submit() {
    // Removed - step 3 photo upload removed
    return;
  }

  async function onFinalize(values: FormValues) {
    if (!values.verificationConfirmed) { setError("verificationConfirmed", { type: "manual", message: "You must confirm" }); return; }
    if (!recordId) { setStatusMessage("Missing record id"); return; }
    setSubmitting(true);
    const res = await api.finalize(recordId, !!values.verificationConfirmed);
    setSubmitting(false);
    if (!res.success) { setStatusMessage(res.error || "Failed to finalize"); return; }
    alert("Technician submitted successfully");
    // reset
    setStep(1);
    setRecordId(null);
    setStatusMessage(null);
  }

  return (
    <div className="max-w-3xl mx-auto p-0 sm:p-6">
      <div className="mb-6">
        <img src="/BMSVG.svg" alt="BM Logo" className="h-12" style={{ filter: "brightness(0) saturate(100%) invert(18%) sepia(67%) saturate(1313%) hue-rotate(206deg)" }} />
      </div>
      <div className="mb-6 mx-0 px-0">
        <h2 className="text-2xl text-center font-semibold text-primary-dark">Join Bharat Mistri as a Skilled Technician</h2>
        <p className="text-center text-gray-600 text-sm mt-2">Register today and start earning. Quick and easy registration for electricians, plumbers, carpenters, and all skilled workers.</p>
      </div>
      <div className="mb-6">
        <small className="block text-center text-gray-500">Step {step} of 3</small>
      </div>

      {statusMessage && <div className={`text-sm mb-2 ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>{statusMessage}</div>}

      {step === 1 && (
        <form onSubmit={handleSubmit(onCreateBasic)} className="space-y-4">
          <div>
            <label className="block font-medium">Full name</label>
            <input {...register("name", { required: "Name is required", minLength: { value: 2, message: "Name must be at least 2 characters" } })} className="mt-1 w-full p-2 border rounded" />
            {errors.name && <div className="text-red-600">{errors.name.message}</div>}
          </div>

          <div>
            <label className="block font-medium">Primary mobile number</label>
            <input {...register("primaryMobileNumber", { required: "Mobile number is required", pattern: { value: /^[0-9]{10}$/, message: "Enter a valid 10-digit mobile number" } })} disabled={otpVerified} className="mt-1 w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed" placeholder="10-digit number" />
            {errors.primaryMobileNumber && <div className="text-red-600">{errors.primaryMobileNumber.message}</div>}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={handleSendOtp} disabled={otpVerified} className="btn btn-outline text-sm sm:text-base px-2 sm:px-4 py-1 sm:py-2">Send OTP</button>
            <input {...register("otp")} placeholder="Enter OTP" disabled={otpVerified} className="p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed text-sm" />
            <button type="button" onClick={() => handleVerifyOtp((watch("otp") || ""))} disabled={otpVerified} className="btn btn-ghost text-sm sm:text-base px-2 sm:px-4 py-1 sm:py-2">Verify OTP</button>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={submitting || !otpVerified} className="btn btn-primary text-sm sm:text-base px-2 sm:px-4 py-1 sm:py-2">Save and Continue</button>
            {!otpVerified && otpAttempted && <span className="text-sm text-gray-600 self-center">Verify OTP to proceed</span>}
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit(onStep2Submit)} className="space-y-4">
          <div>
            <label className="block font-medium">Category</label>
            {categoriesLoading ? (
              <select disabled className="mt-1 w-full p-2 border rounded">
                <option>Loading categories...</option>
              </select>
            ) : categoriesError ? (
              <>
                <input {...register("category", { required: true })} className="mt-1 w-full p-2 border rounded" placeholder="e.g. Electrical" />
                <div className="text-sm text-red-600 mt-1">{categoriesError}</div>
              </>
            ) : (
              <select {...register("category", { required: "Category required" })} className="mt-1 w-full p-2 border rounded">
                <option value="">Select category</option>
                {categories.map((c: any) => (
                  <option key={c._id || c.id || c.value} value={c._id || c.id || c.value}>
                    {c.name?.en || c.name || c.label || c}
                  </option>
                ))}
              </select>
            )}
            {errors.category && <div className="text-red-600">{String(errors.category.message || "Category is required")}</div>}
          </div>

          <div>
            <label className="block font-medium">Skills (comma separated)</label>
            <input {...register("skillsText", { required: true })} className="mt-1 w-full p-2 border rounded" placeholder="e.g. Wiring, Fan Repair" />
            {errors.skillsText && <div className="text-red-600">At least one skill required</div>}
          </div>

          <div>
            <label className="block font-medium">Experience</label>
            <select {...register("experience", { required: true })} className="mt-1 w-full p-2 border rounded">
              <option value="">Select</option>
              <option value="0-1 year">0-1 year</option>
              <option value="1-3 years">1-3 years</option>
              <option value="3+ years">3+ years</option>
            </select>
            {errors.experience && <div className="text-red-600">Experience is required</div>}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="btn btn-outline text-sm sm:text-base px-2 sm:px-4 py-1 sm:py-2">Back</button>
            <button type="submit" disabled={submitting} className="btn btn-primary text-sm sm:text-base px-2 sm:px-4 py-1 sm:py-2">Save and Continue</button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit(onFinalize)} className="space-y-4">
          <div>
            <label className="inline-flex items-center">
              <input type="checkbox" {...register("verificationConfirmed")} className="mr-2" />
              I confirm that the information and photos are authentic and verifiable.
            </label>
            {errors.verificationConfirmed && <div className="text-red-600">You must confirm verification</div>}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(2)} className="btn btn-outline text-sm sm:text-base px-2 sm:px-4 py-1 sm:py-2">Back</button>
            <button type="submit" disabled={submitting} className="btn btn-primary text-sm sm:text-base px-2 sm:px-4 py-1 sm:py-2">Finalize Submission</button>
          </div>
        </form>
      )}
    </div>
  );
}
