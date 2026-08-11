import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <Seo
        title="Page Not Found | ARIGI"
        description="The page you are looking for does not exist. Browse whisky casks for sale on ARIGI."
        noIndex
      />
      <div className="mobile-container flex min-h-[60vh] items-center justify-center py-12">
        <div className="text-center space-y-4">
          <p className="text-6xl font-bold text-primary">404</p>
          <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
          <p className="text-muted-foreground">
            The page you are looking for doesn&apos;t exist or has moved.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button asChild>
              <Link to="/">Return home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/marketplace">Browse casks</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
