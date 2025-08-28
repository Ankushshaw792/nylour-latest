import { CheckCircle, Clock, Mail, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const RegistrationSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-2xl text-green-600">
              Registration Submitted Successfully!
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Thank you for joining Nylour. Your salon registration is now under review.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-start space-x-3 text-left">
              <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Pending Approval</h4>
                <p className="text-sm text-muted-foreground">
                  Your salon is currently being reviewed by our team. This typically takes 1-2 business days.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-left">
              <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Email Confirmation</h4>
                <p className="text-sm text-muted-foreground">
                  You'll receive an email notification once your salon is approved and ready to accept bookings.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-left">
              <Settings className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Dashboard Access</h4>
                <p className="text-sm text-muted-foreground">
                  After approval, you'll be able to access your salon dashboard to manage bookings, queue, and settings.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg text-left">
            <h4 className="font-medium mb-2">What happens next?</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Our team reviews your salon information</li>
              <li>We verify your business details and services</li>
              <li>Once approved, your salon goes live on the platform</li>
              <li>Customers can discover and book with your salon</li>
              <li>You receive dashboard access to manage everything</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={() => navigate('/')}
              variant="outline" 
              className="flex-1"
            >
              Return to Home
            </Button>
            <Button 
              onClick={() => navigate('/salon/dashboard')}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Questions? Contact our support team at{" "}
              <a href="mailto:support@nylour.com" className="text-primary hover:underline">
                support@nylour.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};