import { ArrowRight, MapPin, Calendar, Bell, Clock, Users, TrendingUp, Star, CheckCircle, MessageSquare, Smartphone, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const customerFeatures = [
    {
      icon: Clock,
      title: "Real-time Queue Tracking",
      description: "See exactly where you are in line and how long you'll wait"
    },
    {
      icon: Calendar,
      title: "Simple Booking",
      description: "Book your spot for just ₹5-10 and skip the wait"
    },
    {
      icon: Bell,
      title: "SMS Alerts",
      description: "Get notified 15 minutes before your turn arrives"
    },
    {
      icon: MapPin,
      title: "No More Waiting",
      description: "Walk in exactly when it's your time - no queues!"
    }
  ];

  const salonFeatures = [
    {
      icon: Users,
      title: "Live Queue Management",
      description: "Manage your customer queue in real-time effortlessly"
    },
    {
      icon: CheckCircle,
      title: "Accept/Reject Bookings",
      description: "Full control over online bookings and walk-ins"
    },
    {
      icon: TrendingUp,
      title: "Booking History & Earnings",
      description: "Track your business performance and revenue"
    },
    {
      icon: Star,
      title: "Service & Pricing Control",
      description: "Update services, pricing, and operating hours easily"
    }
  ];

  const faqs = [
    {
      question: "How do I book a salon appointment?",
      answer: "Simply browse nearby salons, select your preferred service, choose a time slot, and pay a small booking fee of ₹5-10. You'll get real-time updates on your queue position."
    },
    {
      question: "How does the queue system work?",
      answer: "Online bookings are prioritized in the queue. You'll receive SMS notifications 15 minutes before your turn, so you can arrive exactly when needed - no waiting around!"
    },
    {
      question: "Can salons join for free?",
      answer: "Yes! Salon registration is completely free. You only pay a small commission on successful bookings. Start managing your queue efficiently today."
    },
    {
      question: "What if I'm running late for my appointment?",
      answer: "No worries! You can see real-time queue updates in the app. If you're running late, you can update your status or reschedule easily through the app."
    }
  ];

  const testimonials = [
    {
      stat: "1,000+",
      description: "Salons onboarded"
    },
    {
      stat: "10,000+",
      description: "Happy customers"
    },
    {
      stat: "60%",
      description: "Reduced wait time"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Skip the Wait.<br />
                Book Your Salon<br />
                Visit Instantly.
              </h1>
              <p className="text-xl lg:text-2xl mb-8 text-white/90 leading-relaxed">
                Discover nearby salons, book your spot, and manage queues – all in one app.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => navigate('/customer')}
                  className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90"
                >
                  Try the Customer App
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate('/salon-dashboard')}
                  className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-primary"
                >
                  List Your Salon
                </Button>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="w-80 h-96 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl flex items-center justify-center">
                  <Smartphone className="h-32 w-32 text-white/70" />
                </div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-secondary rounded-full opacity-80 animate-pulse" />
                <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-primary-light rounded-full opacity-60 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 gradient-text">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get your perfect haircut in just three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                <MapPin className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Find Nearby Salons</h3>
              <p className="text-muted-foreground">
                Browse salons near you with real-time availability and ratings
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                <Calendar className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Book Your Service</h3>
              <p className="text-muted-foreground">
                Choose haircut or beard service, pay ₹5-10, and secure your spot
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                <Bell className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Notified</h3>
              <p className="text-muted-foreground">
                Receive SMS alert 15 minutes before your turn - arrive on time!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Built for Everyone
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Whether you're getting a haircut or running a salon, we've got you covered
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* For Customers */}
            <div>
              <h3 className="text-2xl font-bold mb-8 text-center lg:text-left">
                <span className="gradient-text">For Customers</span>
              </h3>
              <div className="space-y-6">
                {customerFeatures.map((feature, index) => (
                  <Card key={index} className="card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <feature.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">{feature.title}</h4>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* For Salon Owners */}
            <div>
              <h3 className="text-2xl font-bold mb-8 text-center lg:text-left">
                <span className="gradient-text">For Salon Owners</span>
              </h3>
              <div className="space-y-6">
                {salonFeatures.map((feature, index) => (
                  <Card key={index} className="card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <feature.icon className="h-6 w-6 text-secondary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">{feature.title}</h4>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-12">
            Trusted by Thousands
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold mb-2">
                  {testimonial.stat}
                </div>
                <p className="text-white/80 text-lg">{testimonial.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about Nylour
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card border rounded-lg px-6"
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-2 pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Skip the Wait?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of customers and salon owners who are already saving time with Nylour
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/customer')}
              className="text-lg px-8 py-6"
            >
              Try Customer App
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/salon-dashboard')}
              className="text-lg px-8 py-6"
            >
              List Your Salon
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-2xl font-bold gradient-text">Nylour</h3>
              <p className="text-muted-foreground mt-2">Skip the wait. Book instantly.</p>
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <span>|</span>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <span>|</span>
              <a href="#" className="hover:text-foreground transition-colors">Contact Us</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Nylour. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}