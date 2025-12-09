"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "./api"; // <-- keep your api module
import { AmplitudeService } from "../../services/Amplitude";

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

  const amplitude = AmplitudeService.getInstance();

  // UI / messages
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  // categories
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // OTP & verification flags
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpAttempted, setOtpAttempted] = useState(false);

  // separate loading states so spinner appears correctly per-button
  const [loadingSendOtp, setLoadingSendOtp] = useState(false);
  const [loadingVerifyCreate, setLoadingVerifyCreate] = useState(false);
  const [loadingStep2Save, setLoadingStep2Save] = useState(false);
  const [loadingFinalize, setLoadingFinalize] = useState(false);

  // Toast system
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  const showToastMessage = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const {
    register,
    handleSubmit,
    watch,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      primaryMobileNumber: "",
      otp: "",
      category: "",
      skillsText: "",
      experience: "",
      verificationConfirmed: false,
    },
  });

  const watchedMobile = watch("primaryMobileNumber");

  // Reset OTP verification if mobile changes
  useEffect(() => {
    setOtpVerified(false);
    setStatusMessage(null);
  }, [watchedMobile]);

  // load categories on mount
  useEffect(() => {
    let mounted = true;
    async function load() {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
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
      } catch (err) {
        if (!mounted) return;
        setCategoriesLoading(false);
        setCategoriesError("Failed to load categories");
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    amplitude?.track("technician_registration_viewed", {
      page: "registration_form",
    });
  }, []);

  // small spinner component
  const Spinner = ({ size = 16 }: { size?: number }) => (
    <div
      style={{ width: size, height: size }}
      className="border-2 border-white border-t-transparent rounded-full animate-spin"
    />
  );

  // --------------------------
  // Step 1: Send OTP
  // --------------------------
  async function handleSendOtp() {
    setOtpAttempted(true);
    setStatusMessage(null);

    const mobile = watchedMobile || "";
    if (!/^[0-9]{10}$/.test(mobile)) {
      setError("primaryMobileNumber", {
        type: "manual",
        message: "Enter valid 10-digit mobile number",
      });
      return;
    }

    setLoadingSendOtp(true);

    amplitude?.track("otp_send_clicked", {
      mobile_present: !!watchedMobile,
    });

    try {
      const res = await api.sendOtp(mobile);

      if (res && res.success) {
        amplitude?.track("otp_sent_success", {
          mobile: watchedMobile,
        });
        showToastMessage("OTP sent successfully!", "success");
      } else {
        amplitude?.track("otp_sent_failed", {
          reason: res?.error || "unknown",
        });
      }

      if (res && res.success) {
        showToastMessage("OTP sent successfully!", "success");
      } else {
        showToastMessage(res?.error || "Failed to send OTP", "error");
      }
    } catch (err) {
      showToastMessage("Failed to send OTP", "error");
    } finally {
      setLoadingSendOtp(false);
    }
  }

  // --------------------------
  // Step 1: Verify OTP & Create basic (combined)
  // --------------------------
  async function verifyOtpAndContinue() {
    const mobile = watch("primaryMobileNumber") || "";
    const otp = watch("otp") || "";

    amplitude?.track("otp_verify_attempted",{mobile});

    setStatusMessage(null);

    if (!/^[0-9]{10}$/.test(mobile)) {
      setError("primaryMobileNumber", {
        type: "manual",
        message: "Enter valid 10-digit mobile number",
      });
      return;
    }

    if (!/^[0-9]{4,6}$/.test(otp)) {
      setMessageType("error");
      setStatusMessage("Enter a valid OTP");
      showToastMessage("Enter a valid OTP", "error");
      return;
    }

    setLoadingVerifyCreate(true);
    try {
      const otpRes = await api.verifyOtp(mobile, Number(otp));
      if (!otpRes || !otpRes.success) {
        showToastMessage(otpRes?.error || "Invalid OTP", "error");
        setLoadingVerifyCreate(false);
        return;
      }

      // create basic details
      const createRes = await api.createBasicDetails(watch("name"), mobile);
      if (!createRes || !createRes.success) {
        showToastMessage(createRes?.error || "Failed to save details", "error");
        setLoadingVerifyCreate(false);
        return;
      }

      // extract id
      const id =
        createRes.data?.data?._id ||
        createRes.data?._id ||
        createRes.data?.data?.id ||
        createRes.data?.id ||
        null;

      setRecordId(id);
      setOtpVerified(true);
      setMessageType("success");
      setStatusMessage("OTP verified & details saved");
      showToastMessage("OTP verified & details saved", "success");
      setStep(2);

      if (!otpRes || !otpRes.success) {
        amplitude?.track("otp_verification_failed", {
          mobile,
        });
        showToastMessage(otpRes?.error || "Invalid OTP", "error");
        return;
      } else {
        amplitude?.track("otp_verification_success", {
          mobile,
          record_id: id,
        });
      }
    } catch (err) {
      showToastMessage("Unexpected error", "error");
    } finally {
      setLoadingVerifyCreate(false);
    }
  }

  // --------------------------
  // Step 2: Save category/skills/experience
  // --------------------------
  async function onStep2Submit(values: FormValues) {
    // step 2 submit clicked
    amplitude?.track("registration_step2_submit_clicked", {
      step: 2,
    });

    if (!recordId) {
      amplitude?.track("registration_step2_blocked", {
        reason: "missing_record_id",
      });

      showToastMessage("Missing record id", "error");
      return;
    }

    if (!values.category) {
      amplitude?.track("registration_step2_blocked", {
        reason: "category_missing",
      });

      setError("category", { type: "manual", message: "Category required" });
      return;
    }

    if (!values.experience) {
      amplitude?.track("registration_step2_blocked", {
        reason: "experience_missing",
      });

      setError("experience", {
        type: "manual",
        message: "Experience required",
      });
      return;
    }

    setLoadingStep2Save(true);

    const skills = (values.skillsText || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      // backend update started
      amplitude?.track("registration_step2_submit_attempted", {
        record_id: recordId,
        category: values.category,
        skills_count: skills.length,
        experience: values.experience,
      });

      const res = await api.updateSkillsCategory(recordId, {
        category: values.category,
        skills,
        experience: values.experience,
      });

      if (!res || !res.success) {
        amplitude?.track("registration_step2_submit_failed", {
          record_id: recordId,
          error: res?.error || "unknown",
        });

        showToastMessage(res?.error || "Failed to update", "error");
        return;
      }

      // ✅ STEP 2 SUCCESS
      amplitude?.track("registration_step2_completed", {
        record_id: recordId,
        category: values.category,
        skills_count: skills.length,
        experience: values.experience,
      });

      showToastMessage("Details saved", "success");
      setStep(3);
    } catch (err: any) {
      amplitude?.track("registration_step2_error", {
        record_id: recordId,
        message: err?.message || "exception",
      });

      showToastMessage("Unexpected error saving details", "error");
    } finally {
      setLoadingStep2Save(false);
    }
  }

  // --------------------------
  // Step 3: Finalize
  // --------------------------
  async function onFinalize(values: FormValues) {
    // user clicked finalize
    amplitude?.track("registration_finalize_clicked", {
      step: 3,
    });

    if (!values.verificationConfirmed) {
      amplitude?.track("registration_finalize_blocked", {
        reason: "verification_not_confirmed",
      });

      setError("verificationConfirmed", {
        type: "manual",
        message: "You must confirm",
      });
      return;
    }

    if (!recordId) {
      amplitude?.track("registration_finalize_blocked", {
        reason: "missing_record_id",
      });

      showToastMessage("Missing record id", "error");
      return;
    }

    setLoadingFinalize(true);

    try {
      amplitude?.track("registration_finalize_attempted", {
        record_id: recordId,
      });

      const res = await api.finalize(recordId, true);

      if (!res || !res.success) {
        amplitude?.track("registration_finalize_failed", {
          record_id: recordId,
          error: res?.error || "unknown",
        });

        showToastMessage(res?.error || "Failed to finalize", "error");
        return;
      }

      // ✅ SUCCESS — MAIN CONVERSION EVENT
      amplitude?.track("registration_completed", {
        record_id: recordId,
      });

      showToastMessage("Technician submitted successfully!", "success");

      // reset flow (after analytics)
      setStep(1);
      setRecordId(null);
      setStatusMessage(null);
      reset();
      setOtpVerified(false);
      setOtpAttempted(false);
    } catch (err: any) {
      amplitude?.track("registration_finalize_error", {
        record_id: recordId,
        message: err?.message || "exception",
      });

      showToastMessage("Unexpected error during finalize", "error");
    } finally {
      setLoadingFinalize(false);
    }
  }

  // --------------------------
  // JSX
  // --------------------------
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8">
      <div className="mb-6">
        <img
          src="/BMSVG.svg"
          alt="BM Logo"
          className="h-12"
          style={{
            filter:
              "brightness(0) saturate(100%) invert(18%) sepia(67%) saturate(1313%) hue-rotate(206deg)",
          }}
        />
      </div>

      <div className="mb-6">
        <h2 className="text-2xl text-center font-semibold text-primary-dark">
          <span className="hidden sm:inline">
            Join Bharat Mistri as a Skilled Technician
          </span>
          <span className="sm:hidden">Join Bharat Mistri</span>
        </h2>
        <p className="hidden sm:block text-center text-gray-600 text-sm mt-2">
          Register today and start earning. Quick and easy registration for
          electricians, plumbers, carpenters, and all skilled workers.
        </p>
      </div>

      <div className="mb-6">
        <small className="block text-center text-gray-500">
          Step {step} of 3
        </small>
      </div>

      {statusMessage && (
        <div
          className={`text-sm mb-2 ${
            messageType === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {statusMessage}
        </div>
      )}

      {/* ---------- STEP 1 ---------- */}
      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifyOtpAndContinue();
          }}
          className="space-y-6"
        >
          <div>
            <label className="block font-medium">Full name</label>
            <input
              {...register("name", {
                required: "Name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters",
                },
              })}
              className="mt-1 w-full p-2 border rounded"
            />
            {errors.name && (
              <div className="text-red-600">{errors.name.message}</div>
            )}
          </div>

          <div>
            <label className="block font-medium">Primary mobile number</label>
            <div className="flex gap-2 mt-1">
              <input
                {...register("primaryMobileNumber", {
                  required: "Mobile number is required",
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Enter a valid 10-digit mobile number",
                  },
                })}
                disabled={otpVerified}
                className="flex-6 p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="10-digit number"
              />

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpVerified || loadingSendOtp}
                className="flex-4 h-10 px-2 py-2 border rounded text-sm sm:text-base bg-white hover:bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingSendOtp ? <Spinner /> : "Send OTP"}
              </button>
            </div>

            {errors.primaryMobileNumber && (
              <div className="text-red-600 text-sm mt-1">
                {errors.primaryMobileNumber.message}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 pt-2">
            <input
              {...register("otp")}
              placeholder="Enter OTP"
              disabled={otpVerified}
              className="p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed text-sm flex-1"
            />

            <button
              type="submit"
              disabled={loadingVerifyCreate}
              className="h-10 min-w-[140px] px-4 py-2 pri text-white bg-primary rounded flex items-center justify-center gap-2"
            >
              {loadingVerifyCreate ? <Spinner /> : "Verify OTP & Continue"}
            </button>
          </div>
        </form>
      )}

      {/* ---------- STEP 2 ---------- */}
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
                <input
                  {...register("category")}
                  className="mt-1 w-full p-2 border rounded"
                  placeholder="e.g. Electrical"
                />
                <div className="text-sm text-red-600 mt-1">
                  {categoriesError}
                </div>
              </>
            ) : (
              <select
                {...register("category", { required: "Category required" })}
                className="mt-1 w-full p-2 border rounded"
              >
                <option value="">Select category</option>
                {categories.map((c: any) => (
                  <option
                    key={c._id || c.id || c.value}
                    value={c._id || c.id || c.value}
                  >
                    {c.name?.en || c.name || c.label || c}{" "}
                    {`(${c.name?.hi || ""})`}
                  </option>
                ))}
              </select>
            )}
            {errors.category && (
              <div className="text-red-600">
                {String(errors.category.message || "Category is required")}
              </div>
            )}
          </div>

          <div>
            <label className="block font-medium">
              Skills (comma separated)
            </label>
            <input
              {...register("skillsText")}
              className="mt-1 w-full p-2 border rounded"
              placeholder="e.g. Wiring, Fan Repair"
            />
            {errors.skillsText && (
              <div className="text-red-600">At least one skill required</div>
            )}
          </div>

          <div>
            <label className="block font-medium">Experience</label>
            <select
              {...register("experience", { required: "Experience required" })}
              className="mt-1 w-full p-2 border rounded"
            >
              <option value="">Select</option>
              <option value="0-1 year">0-1 year</option>
              <option value="1-3 years">1-3 years</option>
              <option value="3+ years">3+ years</option>
            </select>
            {errors.experience && (
              <div className="text-red-600">Experience is required</div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="border px-4 py-2 rounded"
            >
              Back
            </button>

            <button
              type="submit"
              disabled={loadingStep2Save}
              className="h-10 min-w-[140px] px-4 py-2 bg-primary text-white rounded flex items-center justify-center gap-2"
            >
              {loadingStep2Save ? <Spinner /> : "Save and Continue"}
            </button>
          </div>
        </form>
      )}

      {/* ---------- STEP 3 ---------- */}
      {step === 3 && (
        <form onSubmit={handleSubmit(onFinalize)} className="space-y-4">
          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                {...register("verificationConfirmed")}
                className="mr-2"
              />
              I confirm that the information and photos are authentic and
              verifiable.
            </label>
            {errors.verificationConfirmed && (
              <div className="text-red-600">You must confirm verification</div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="border px-4 py-2 rounded"
            >
              Back
            </button>

            <button
              type="submit"
              disabled={loadingFinalize}
              className="h-10 min-w-[140px] px-4 py-2 bg-primary text-white rounded flex items-center justify-center gap-2"
            >
              {loadingFinalize ? <Spinner /> : "Finalize Submission"}
            </button>
          </div>
        </form>
      )}

      {/* ---------- TOAST ---------- */}
      {showToast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-3 rounded shadow-lg text-sm text-center max-w-[90%] ${
            toastType === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
