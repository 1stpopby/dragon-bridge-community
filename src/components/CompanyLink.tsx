import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

interface CompanyLinkProps {
  authorName: string;
  userId?: string;
  className?: string;
  showBadge?: boolean;
}

const CompanyLink = ({ authorName, userId, className = "", showBadge = true }: CompanyLinkProps) => {
  const [companyData, setCompanyData] = useState<{
    id: string;
    account_type: string;
    company_name: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchCompanyData();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchCompanyData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, account_type, company_name')
        .eq('user_id', userId)
        .eq('account_type', 'company')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching company data:', error);
        return;
      }

      setCompanyData(data);
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <span className={className}>{authorName}</span>;
  }

  if (!companyData) {
    return <span className={className}>{authorName}</span>;
  }

  const displayName = companyData.company_name || authorName;

  return (
    <div className="flex items-center gap-2">
      <Link 
        to={`/company/${companyData.id}`}
        className={`hover:text-primary transition-colors ${className}`}
      >
        {displayName}
      </Link>
      {showBadge && (
        <Badge variant="outline" className="bg-primary/10 text-primary text-xs">
          <Building2 className="h-3 w-3 mr-1" />
          Company
        </Badge>
      )}
    </div>
  );
};

export default CompanyLink;