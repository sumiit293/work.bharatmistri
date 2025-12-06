import axios, { AxiosInstance } from "axios";

// Build the API base URL. If the environment provides a base URL
// without the router mount path, append the expected prefix so
// frontend calls target `/api/technicianRecruitmentDrive`.
const DEFAULT_API_BASE = "https://api.bharatmistri.com";
let RAW_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
// If no env var is provided in production builds, fall back to the official API
if (!RAW_BASE && process.env.NODE_ENV === "production") {
  RAW_BASE = DEFAULT_API_BASE;
}
const PREFIX = "/api/technicianRecruitmentDrive";
const API_BASE = RAW_BASE.includes(PREFIX) ? RAW_BASE : (RAW_BASE + PREFIX);

type ApiResult<T> = Promise<{ success: boolean; data?: T; error?: string }>;

// By default do not send credentials (cookies) so browsers accept wildcard CORS.
// If you need credentials, set NEXT_PUBLIC_API_WITH_CREDENTIALS=true in your env.
const WITH_CREDENTIALS = process.env.NEXT_PUBLIC_API_WITH_CREDENTIALS === "true";
const client: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: WITH_CREDENTIALS,
  headers: {
    "Content-Type": "application/json",
  },
});

async function toResult<T>(p: Promise<any>): ApiResult<T> {
  try {
    const res = await p;
    return { success: true, data: res.data };
  } catch (err: unknown) {
    const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : (err as Error).message;
    return { success: false, error: message };
  }
}

export async function createBasicDetails(name: string, primaryMobileNumber: string) {
  return toResult<any>(client.post("/create-basic-details", { name, primaryMobileNumber }));
}

export async function sendOtp(mobileNumber: string) {
  return toResult<any>(client.post("/send-otp", { mobileNumber }));
}

export async function verifyOtp(mobileNumber: string, otp: number) {
  return toResult<any>(client.post("/verify-otp", { mobileNumber, otp }));
}

export async function updateSkillsCategory(id: string, payload: { category?: string; skills?: string[]; experience?: string }) {
  return toResult<any>(client.put(`/${id}/skills-category`, payload));
}

export async function uploadWorkPhotos(id: string, photos: string[]) {
  return toResult<any>(client.post(`/${id}/upload-work-photos`, { photos }));
}

export async function finalize(id: string, verificationConfirmed: boolean) {
  return toResult<any>(client.post(`/${id}/finalize`, { verificationConfirmed }));
}

// Fetch technician categories. The backend returns a payload under
// `data.data.technicianCategories`. This helper extracts and returns
// that array so callers get a simple shape: { success, data: TechnicianCategory[] }
export async function getTechnicianCategoryList() {
  try {
    const res = await client.get("/getTechnicianCategoryList");
    const categories = res?.data?.data?.technicianCategories || [];
    return { success: true, data: categories } as { success: true; data: any[] };
  } catch (err: unknown) {
    const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : (err as Error).message;
    return { success: false, error: message } as { success: false; error: string };
  }
}

// S3 upload helper: posts a single file to the backend S3 route and
// expects the backend to return the uploaded file URL.
export async function uploadSingleFileToS3(file: File) {
  try {
    const form = new FormData();
    form.append("file", file);

    // RAW_BASE is the base provided in env (without the technician prefix).
    // Build S3 endpoint at `${RAW_BASE}/api/s3/uploadSingleFile`.
    const s3Base = RAW_BASE.includes("/api/s3") ? RAW_BASE : `${RAW_BASE}/api/s3`;
    const res = await axios.post(`${s3Base}/uploadSingleFile`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: WITH_CREDENTIALS,
    });
    
    const url = res?.data?.data?.url;
    if (!url) return { success: false, error: "No URL returned from S3 upload", data: "" } as { success: false; error: string, data: string };
    return { success: true, data: url } as { success: true; data: string };
  } catch (err: unknown) {
    const message = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : (err as Error).message;
    return { success: false, error: message , data: ""} as { success: false; error: string, data: string };
  }
}

export default {
  createBasicDetails,
  sendOtp,
  verifyOtp,
  updateSkillsCategory,
  uploadWorkPhotos,
  finalize,
  getTechnicianCategoryList,
  uploadSingleFileToS3,
};
 