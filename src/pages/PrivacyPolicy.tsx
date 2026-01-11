import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LandingFooter } from "@/components/layout/LandingFooter";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <button 
            onClick={() => navigate('/')}
            className="text-2xl font-bold gradient-text hover:opacity-80 transition-opacity"
          >
            Nylour
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 11, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              At Nylour, we are committed to protecting your privacy. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our salon booking and queue management platform. 
              Please read this policy carefully to understand our practices regarding your personal data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect information that you provide directly to us and information collected automatically:
            </p>
            
            <h3 className="text-lg font-medium mt-6 mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Name and contact details (email, phone number)</li>
              <li>Account credentials</li>
              <li>Profile information and preferences</li>
              <li>Payment information (processed securely through third-party providers)</li>
              <li>Booking history and service preferences</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Location Data</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>GPS location (with your permission) to find nearby salons</li>
              <li>Address information for service delivery</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Automatically Collected Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Device information (type, operating system, browser)</li>
              <li>Usage data (pages visited, features used, time spent)</li>
              <li>IP address and approximate location</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>To provide and maintain our Service</li>
              <li>To process bookings and payments</li>
              <li>To send booking confirmations and reminders via SMS and email</li>
              <li>To notify you about queue status and wait times</li>
              <li>To personalize your experience and recommend relevant salons</li>
              <li>To communicate with you about updates, promotions, and offers</li>
              <li>To improve our Service and develop new features</li>
              <li>To detect, prevent, and address technical issues or fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li><strong>With Salons:</strong> Your name, contact details, and booking information are shared with 
                salons you book with to facilitate your appointments</li>
              <li><strong>Payment Processors:</strong> Payment information is securely processed by trusted 
                third-party payment providers</li>
              <li><strong>Service Providers:</strong> We may share data with vendors who assist in operating 
                our platform (hosting, analytics, customer support)</li>
              <li><strong>Legal Requirements:</strong> We may disclose information when required by law or 
                to protect our rights and safety</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. SMS and Email Communications</h2>
            <p className="text-muted-foreground leading-relaxed">
              By using our Service, you consent to receive:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Booking confirmations and reminders</li>
              <li>Queue status updates and "your turn" notifications</li>
              <li>Service completion notifications</li>
              <li>Important account and security alerts</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You can opt out of promotional communications at any time through your account settings 
              or by contacting us directly. Transactional messages related to your bookings cannot be opted out.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal data, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication mechanisms</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls limiting who can view your data</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              However, no method of transmission over the Internet is 100% secure, and we cannot guarantee 
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise these rights, please contact us using the information provided below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Keep you logged in to your account</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze usage patterns to improve our Service</li>
              <li>Deliver relevant content and advertisements</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You can control cookie preferences through your browser settings. Note that disabling 
              cookies may affect some features of our Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service may contain links to third-party websites or integrate with third-party services. 
              We are not responsible for the privacy practices of these external sites. We encourage you to 
              review the privacy policies of any third-party services you use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service is not intended for children under 13 years of age. We do not knowingly collect 
              personal information from children. If you believe we have collected data from a child, 
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">11. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal data for as long as necessary to provide our services and fulfill 
              the purposes described in this policy. Booking history may be retained for legal and 
              accounting purposes. You can request deletion of your account at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">12. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any significant 
              changes by posting the new policy on this page and updating the "Last updated" date. 
              We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">13. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Email: <a href="mailto:ankushshaw007@gmail.com" className="text-primary hover:underline">ankushshaw007@gmail.com</a></li>
              <li>Phone: <a href="tel:+917003107472" className="text-primary hover:underline">+91 7003107472</a></li>
            </ul>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
