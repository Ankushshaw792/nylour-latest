import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LandingFooter } from "@/components/layout/LandingFooter";

export default function TermsOfService() {
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
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 11, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using the Nylour platform ("Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our Service. These terms apply to all users, 
              including customers booking salon services and salon owners managing their businesses through our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Description of Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nylour is a salon booking and queue management platform that connects customers with local salons. 
              Our services include:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Online booking for salon services</li>
              <li>Real-time queue management and wait time estimates</li>
              <li>Payment processing for booking fees</li>
              <li>Salon discovery based on location</li>
              <li>Salon management tools for business owners</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              To use certain features of our Service, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information during registration</li>
              <li>Updating your information to keep it current</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Booking and Payments</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you book a service through Nylour:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>A nominal booking fee (typically ₹5-10) may be charged to confirm your slot</li>
              <li>The booking fee is non-refundable except in cases of salon cancellation</li>
              <li>Full service payment is made directly to the salon</li>
              <li>Prices displayed are set by individual salons and may vary</li>
              <li>We use secure payment processing through trusted third-party providers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Cancellation Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our cancellation policy is designed to be fair to both customers and salons:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Cancellations made more than 2 hours before the appointment may be eligible for booking fee refund</li>
              <li>Late cancellations or no-shows will result in forfeiture of the booking fee</li>
              <li>Repeated cancellations may result in account restrictions</li>
              <li>Salons may have additional cancellation policies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. User Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed">
              As a user of Nylour, you agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Arrive on time for your booked appointments</li>
              <li>Treat salon staff with respect and courtesy</li>
              <li>Provide accurate contact information for notifications</li>
              <li>Not misuse the platform or engage in fraudulent activities</li>
              <li>Comply with individual salon rules and policies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Salon Owner Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed">
              Salon owners using our platform agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Provide accurate business information and service details</li>
              <li>Honor bookings made through the platform</li>
              <li>Maintain professional service standards</li>
              <li>Update availability and wait times in real-time</li>
              <li>Comply with all applicable local laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Nylour name, logo, and all related content are the property of Nylour. You may not use, 
              reproduce, or distribute any of our intellectual property without prior written consent. 
              User-generated content remains the property of the respective users, but you grant us a 
              license to use such content for platform operations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nylour acts as an intermediary between customers and salons. We are not responsible for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>The quality of services provided by salons</li>
              <li>Disputes between customers and salon owners</li>
              <li>Any injuries or damages occurring at salon premises</li>
              <li>Service delays beyond our control</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Our liability is limited to the amount of booking fees paid through our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms of Service are governed by the laws of India. Any disputes arising from these 
              terms shall be subject to the exclusive jurisdiction of the courts in Kolkata, West Bengal, India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">11. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of significant 
              changes through email or in-app notifications. Continued use of the Service after changes 
              constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please contact us:
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
