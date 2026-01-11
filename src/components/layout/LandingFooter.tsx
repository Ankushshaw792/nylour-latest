import { Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function LandingFooter() {
  const navigate = useNavigate();

  const handleFeaturesClick = () => {
    navigate('/');
    setTimeout(() => {
      const featuresSection = document.getElementById('features');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
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
                  onClick={handleFeaturesClick} 
                  className="hover:text-foreground transition-colors"
                >
                  Features
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button 
                  onClick={() => navigate('/terms')} 
                  className="hover:text-foreground transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/privacy')} 
                  className="hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2026-30 Nylour. All rights reserved. Built for salon owners, by salon enthusiasts.</p>
        </div>
      </div>
    </footer>
  );
}
