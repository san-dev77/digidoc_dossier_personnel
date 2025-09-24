import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

interface NavigationProps {
  breadcrumbs?: BreadcrumbItem[];
  currentStep?: string;
  currentStepDescription?: string;
}

export default function Navigation({
  breadcrumbs,
  currentStep,
  currentStepDescription,
}: NavigationProps) {
  const pathname = usePathname();

  // Génération automatique des breadcrumbs si non fournis
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: "Accueil", href: "/" },
  ];

  if (pathname.startsWith("/agents")) {
    defaultBreadcrumbs.push({ label: "Gestion des Agents", href: "/agents" });
  } else if (pathname.startsWith("/dossiers")) {
    defaultBreadcrumbs.push({
      label: "Gestion des Dossiers",
      href: "/dossiers",
    });
  } else if (pathname.startsWith("/pieces")) {
    defaultBreadcrumbs.push({ label: "Gestion des Pièces", href: "/pieces" });
  } else if (pathname.startsWith("/rubriques")) {
    defaultBreadcrumbs.push({
      label: "Gestion des Rubriques",
      href: "/rubriques",
    });
  } else if (pathname.startsWith("/rapports")) {
    defaultBreadcrumbs.push({
      label: "Rapports de Conformité",
      href: "/rapports",
    });
  }

  const finalBreadcrumbs = breadcrumbs || defaultBreadcrumbs;

  return (
    <div className="bg-white border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header principal avec logo */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">
                DigiDoc Personnel
              </span>
            </Link>
          </div>

          {/* Navigation principale */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/agents"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith("/agents")
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              Agents
            </Link>
            <Link
              href="/dossiers"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith("/dossiers")
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              Dossiers
            </Link>
            <Link
              href="/pieces"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith("/pieces")
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              Pièces
            </Link>
            <Link
              href="/rubriques"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith("/rubriques")
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              Rubriques
            </Link>
          </nav>

          {/* Actions utilisateur */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
              <span className="sr-only">Notifications</span>
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">3</span>
              </div>
            </button>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">U</span>
            </div>
          </div>
        </div>

        {/* Breadcrumbs et description de l'étape */}
        {(finalBreadcrumbs.length > 1 || currentStep) && (
          <div className="py-4 border-t border-blue-50">
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
              {finalBreadcrumbs.map((item, index) => (
                <div key={item.href} className="flex items-center">
                  {index > 0 && <ChevronRight className="w-4 h-4 mx-2" />}
                  <Link
                    href={item.href}
                    className={`hover:text-blue-600 transition-colors ${
                      item.current ? "text-blue-600 font-medium" : ""
                    }`}
                  >
                    {index === 0 ? <Home className="w-4 h-4" /> : item.label}
                  </Link>
                </div>
              ))}
            </nav>

            {/* Description de l'étape actuelle */}
            {currentStep && (
              <div className="flex items-center space-x-3">
                <h1 className="text-lg font-semibold text-gray-900">
                  {currentStep}
                </h1>
                {currentStepDescription && (
                  <span className="text-sm text-gray-500">
                    — {currentStepDescription}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
