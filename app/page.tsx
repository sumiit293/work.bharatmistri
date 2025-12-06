import RegistrationForm from "./recruitment/RegistrationForm";
import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://work.bharatmistri.com"),
  title: "Start Working on Bharat Mistri - Register as Technician Today",
  description: "Join work.bharatmistri.com and start earning as a skilled technician. Easy registration for electricians, plumbers, carpenters, and all home service professionals.",
  keywords: [
    "work as technician",
    "join Bharat Mistri",
    "technician jobs",
    "register as technician",
    "skilled worker jobs",
    "home services",
    "electrician",
    "plumber",
    "carpenter",
    "earn money",
    "part time work",
    "gig work",
    "worker registration",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://work.bharatmistri.com",
    siteName: "Bharat Mistri",
    title: "Start Working on Bharat Mistri - Register as Technician",
    description: "Join thousands of skilled workers earning on Bharat Mistri. Quick registration for electricians, plumbers, carpenters and more.",
    images: [
      {
        url: "/BMSVG.svg",
        width: 1200,
        height: 630,
        alt: "Bharat Mistri - Work as Technician",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Schema.org structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Bharat Mistri Technician Registration",
            description: "Register as a skilled technician and start earning on Bharat Mistri",
            applicationCategory: "ServiceApplication",
            offers: {
              "@type": "Offer",
              description: "Register as a technician for home services",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Bharat Mistri",
            url: "https://work.bharatmistri.com",
            logo: "https://work.bharatmistri.com/BMSVG.svg",
            description: "Work platform for skilled technicians and home service professionals",
            sameAs: [
              "https://www.instagram.com/bharat_mistri_official/",
            ],
          }),
        }}
      />

      <div className="py-4 px-0">
        <div className="mx-auto max-w-4xl dark:bg-black p-2">
          <RegistrationForm />
        </div>
      </div>
    </main>
  );
}
