/**
 * @fileoverview Needs assessment modal component
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Interactive modal to help users identify their needs and navigate to relevant resources.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, HelpCircle, Home, Utensils, Heart, Scale, Users, Briefcase, Phone, Sparkles, Accessibility } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface NeedsAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Question {
  id: string;
  text: string;
  helpText: string;
  options: {
    label: string;
    icon: typeof Home;
    value: string;
    categories?: string[];
  }[];
}

const questions: Question[] = [
  {
    id: "urgency",
    text: "How urgent is your situation right now?",
    helpText: "This helps us show you the most relevant resources first.",
    options: [
      { label: "Emergency - I need help right now", icon: Phone, value: "emergency", categories: ["crisis"] },
      { label: "Urgent - I need help today", icon: HelpCircle, value: "urgent" },
      { label: "Not urgent - I'm planning ahead", icon: Sparkles, value: "planning" },
    ],
  },
  {
    id: "primary_need",
    text: "What do you need help with most?",
    helpText: "Select what feels most important right now. You can always explore other resources later.",
    options: [
      { label: "A safe place to stay", icon: Home, value: "shelter", categories: ["shelters"] },
      { label: "Food or meals", icon: Utensils, value: "food", categories: ["food-banks"] },
      { label: "Health or mental health support", icon: Heart, value: "health", categories: ["health"] },
      { label: "Help with addiction or recovery", icon: Heart, value: "addiction", categories: ["addiction"] },
      { label: "Legal help or advice", icon: Scale, value: "legal", categories: ["legal"] },
      { label: "Support for my family or children", icon: Users, value: "family", categories: ["family"] },
      { label: "Disability support or services", icon: Accessibility, value: "disability", categories: ["disability"] },
      { label: "Finding a job or training", icon: Briefcase, value: "employment", categories: ["employment"] },
      { label: "Something else", icon: HelpCircle, value: "other" },
    ],
  },
  {
    id: "who_for",
    text: "Who is this help for?",
    helpText: "This helps us find resources that are right for your situation.",
    options: [
      { label: "Just me", icon: Users, value: "self" },
      { label: "Me and my children", icon: Users, value: "family", categories: ["family"] },
      { label: "A young person (under 25)", icon: Sparkles, value: "youth", categories: ["youth"] },
      { label: "A senior (65+)", icon: Users, value: "senior", categories: ["seniors"] },
      { label: "A person with a disability", icon: Accessibility, value: "disability_person", categories: ["disability"] },
      { label: "Someone else I'm helping", icon: Heart, value: "other" },
    ],
  },
];

export function NeedsAssessmentModal({ isOpen, onClose }: NeedsAssessmentModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [, setLocation] = useLocation();

  const handleAnswer = (questionId: string, value: string, categories?: string[]) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const allCategories: string[] = [];
      questions.forEach((q) => {
        const answer = newAnswers[q.id];
        const option = q.options.find((o) => o.value === answer);
        if (option?.categories) {
          allCategories.push(...option.categories);
        }
      });

      const uniqueCategories = Array.from(new Set(allCategories));
      
      if (newAnswers.urgency === "emergency") {
        setLocation("/category/crisis");
      } else if (uniqueCategories.length > 0) {
        setLocation(`/category/${uniqueCategories[0]}`);
      } else {
        const event = new CustomEvent('openChat');
        window.dispatchEvent(event);
      }
      
      onClose();
      setCurrentStep(0);
      setAnswers({});
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden m-2 sm:m-0"
            onClick={(e) => e.stopPropagation()}
            data-testid="modal-needs-assessment"
          >
            <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span className="font-semibold text-sm sm:text-base text-gray-900">Help Me Find Resources</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                data-testid="button-close-assessment"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="h-1 bg-gray-100">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-180px)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                    Step {currentStep + 1} of {questions.length}
                  </p>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    {currentQuestion.text}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                    {currentQuestion.helpText}
                  </p>

                  <div className="space-y-2 sm:space-y-3">
                    {currentQuestion.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(currentQuestion.id, option.value, option.categories)}
                        className="w-full p-3 sm:p-4 rounded-xl border-2 border-gray-100 hover:border-primary/50 hover:bg-primary/5 active:bg-primary/10 active:scale-[0.98] transition-all flex items-center gap-2 sm:gap-3 text-left group touch-manipulation min-h-[60px] sm:min-h-[72px]"
                        data-testid={`button-option-${option.value}`}
                        aria-label={option.label}
                      >
                        <div className="p-1.5 sm:p-2 rounded-lg bg-gray-100 group-hover:bg-primary/10 transition-colors shrink-0">
                          <option.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-primary transition-colors" aria-hidden="true" />
                        </div>
                        <span className="font-medium text-sm sm:text-base text-gray-700 group-hover:text-gray-900 flex-1">
                          {option.label}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors shrink-0" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="p-3 sm:p-4 border-t border-gray-100 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="gap-1 text-sm sm:text-base min-h-[44px] touch-manipulation"
                data-testid="button-back-step"
                aria-label="Go back to previous question"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  const event = new CustomEvent('openChat');
                  window.dispatchEvent(event);
                  onClose();
                }}
                className="text-xs sm:text-sm text-gray-500 min-h-[44px] touch-manipulation"
                data-testid="button-skip-chat"
              >
                <span className="hidden sm:inline">Skip to chat instead</span>
                <span className="sm:hidden">Skip</span>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
