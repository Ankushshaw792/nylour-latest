import { Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function LandingFooter() {
  const navigate = useNavigate();

  const handleComingSoon = (feature: string) => {
    toast.info(`${feature} - Coming Soon!`);
  };

  return (
    <footer className="py-12 border-t bg-card">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <button 
              onClick={() => navigate('/')}
              className="text-2xl font-bold gradient-text mb-4 block hover:opacity-80 transition-opacity"
            >
              Nylour
            </button>
            <p className="text-muted-foreground mb-4">
              Empowering salons with smart technology to grow their business.
            </p>
            <div className="flex space-x-4">
              <Button size="sm" variant="outline" asChild>
                <a href="tel:+917003107472">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Support
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href="mailto:ankushshaw007@gmail.com">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Us
                </a>
              </Button>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">For Salons</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button 
                  onClick={() => navigate('/salon-register')} 
                  className="hover:text-foreground transition-colors"
                >
                  Register Your Salon
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleComingSoon('Pricing')} 
                  className="hover:text-foreground transition-colors"
                >
                  Pricing
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleComingSoon('Features')} 
                  className="hover:text-foreground transition-colors"
                >
                  Features
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleComingSoon('Success Stories')} 
                  className="hover:text-foreground transition-colors"
                >
                  Success Stories
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button 
                  onClick={() => handleComingSoon('Help Center')} 
                  className="hover:text-foreground transition-colors"
                >
                  Help Center
                </button>
              </li>
              <li>
                <a 
                  href="mailto:ankushshaw007@gmail.com" 
                  className="hover:text-foreground transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <button 
                  onClick={() => handleComingSoon('Terms of Service')} 
                  className="hover:text-foreground transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleComingSoon('Privacy Policy')} 
                  className="hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Nylour. All rights reserved. Built for salon owners, by salon enthusiasts.</p>
        </div>
      </div>
    </footer>
  );
}
