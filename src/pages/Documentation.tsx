import { useAuth } from "@/contexts/AuthContext";
import DistilleryDocs from "./DistilleryDocs";
import ConsumerDocs from "./ConsumerDocs";

const Documentation = () => {
  const { userRole } = useAuth();
  const isDistilleryAudience = userRole === "distillery" || userRole === "administrator";
  return isDistilleryAudience ? <DistilleryDocs /> : <ConsumerDocs />;
};

export default Documentation;