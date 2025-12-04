"use client";

import { X, AlertCircle, Info, Key, Mail, Shield } from "lucide-react";

interface LoginErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
}

export default function LoginErrorModal({
  isOpen,
  onClose,
  error,
}: LoginErrorModalProps) {
  if (!isOpen) return null;

  const getErrorDetails = (errorMsg: string) => {
    // Identifiants incorrects
    if (errorMsg.includes("Identifiants incorrects") || errorMsg.includes("incorrect")) {
      return {
        title: "Identifiants Incorrects",
        icon: Key,
        color: "red",
        explanations: [
          "Le nom d'utilisateur, email ou mot de passe est invalide",
          "Vérifiez que vous n'avez pas fait de faute de frappe",
          "Assurez-vous que Caps Lock n'est pas activé",
        ],
        solutions: [
          "Vérifiez votre nom d'utilisateur ou email",
          "Vérifiez votre mot de passe",
          "Si vous avez oublié votre mot de passe, contactez un administrateur",
        ],
      };
    }

    // Compte agent sans accès
    if (errorMsg.includes("agent n'a pas accès") || errorMsg.includes("compte agent")) {
      return {
        title: "Compte Agent Non Autorisé",
        icon: Shield,
        color: "orange",
        explanations: [
          "Vous utilisez un matricule d'agent",
          "Les agents n'ont pas accès direct à l'application",
          "Un compte utilisateur doit être créé pour vous",
        ],
        solutions: [
          "Contactez un administrateur",
          "Demandez la création d'un compte utilisateur",
          "Un admin peut lier votre matricule à un compte utilisateur",
        ],
      };
    }

    // Compte inactif
    if (errorMsg.includes("inactif") || errorMsg.includes("suspendu")) {
      return {
        title: "Compte Inactif ou Suspendu",
        icon: AlertCircle,
        color: "yellow",
        explanations: [
          "Votre compte a été désactivé ou suspendu",
          "Vous ne pouvez plus accéder à l'application",
        ],
        solutions: [
          "Contactez votre administrateur",
          "Demandez la réactivation de votre compte",
        ],
      };
    }

    // Utilisateur non trouvé
    if (errorMsg.includes("non trouvé") || errorMsg.includes("n'existe pas")) {
      return {
        title: "Compte Non Trouvé",
        icon: Mail,
        color: "blue",
        explanations: [
          "Aucun compte ne correspond à cet identifiant",
          "Vous n'avez peut-être pas encore de compte",
        ],
        solutions: [
          "Vérifiez l'orthographe de votre identifiant",
          "Demandez à un administrateur de créer votre compte",
          "Assurez-vous d'utiliser le bon identifiant (username ou email, pas matricule)",
        ],
      };
    }

    // Erreur générique
    return {
      title: "Erreur de Connexion",
      icon: AlertCircle,
      color: "red",
      explanations: [errorMsg],
      solutions: [
        "Vérifiez votre connexion internet",
        "Réessayez dans quelques instants",
        "Si le problème persiste, contactez le support",
      ],
    };
  };

  const details = getErrorDetails(error);
  const Icon = details.icon;

  const colorClasses = {
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: "text-red-600",
      button: "bg-red-600 hover:bg-red-700",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-800",
      icon: "text-orange-600",
      button: "bg-orange-600 hover:bg-orange-700",
    },
    yellow: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      icon: "text-yellow-600",
      button: "bg-yellow-600 hover:bg-yellow-700",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: "text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700",
    },
  };

  const colors = colorClasses[details.color as keyof typeof colorClasses];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border-2 border-gray-200 overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-5 ${colors.bg} border-b ${colors.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center border-2 ${colors.border}`}>
                <Icon className={`h-6 w-6 ${colors.icon}`} />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${colors.text}`}>
                  {details.title}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`${colors.text} hover:bg-white/50 p-2 rounded-lg transition-all`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Explications */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-5 w-5 text-gray-700" />
              <h4 className="font-bold text-gray-900">Que s'est-il passé ?</h4>
            </div>
            <ul className="space-y-2">
              {details.explanations.map((exp, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-800 font-medium">
                  <span className={`mt-0.5 ${colors.text} font-bold`}>•</span>
                  <span>{exp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div className={`p-4 ${colors.bg} rounded-xl border-2 ${colors.border}`}>
            <h4 className={`font-bold ${colors.text} mb-3`}>💡 Solutions :</h4>
            <ul className="space-y-2">
              {details.solutions.map((sol, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-800 font-medium">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>{sol}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className={`${colors.button} text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105`}
          >
            J'ai Compris
          </button>
        </div>
      </div>
    </div>
  );
}

