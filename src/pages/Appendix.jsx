import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scroll, Book, Dumbbell, Info, Shield, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  {
    id: "abbreviations",
    title: "Abbreviations & Terminology",
    icon: Book,
    content: [
      { term: "PP", definition: "Power Position", description: "The final throwing position before release" },
      { term: "FT", definition: "Full Throw", description: "Complete throwing motion from start to finish" },
      { term: "SA", definition: "South African", description: "A specific drill technique for discus and shot" },
      { term: "IS", definition: "Impulse Step", description: "Quick stepping drill for rhythm development" },
      { term: "MB", definition: "Medicine Ball", description: "Weighted ball used for power development" },
      { term: "ER", definition: "External Rotation", description: "Shoulder rotation exercise for javelin" },
      { term: "TQ", definition: "Technical Quality throws", description: "Focus on form over distance" },
      { term: "Lift-H", definition: "Heavy Lift Day", description: "Strength emphasis in weight room" },
      { term: "Lift-P", definition: "Power Lift Day", description: "Explosive/power emphasis in weight room" },
    ],
  },
  {
    id: "implements",
    title: "Implement Specifications",
    icon: Target,
    content: [
      { 
        event: "Shot Put",
        specs: [
          "High School Boys: 12 lb (5.44 kg)",
          "High School Girls: 4 kg (8.8 lb)",
          "Diameter: 110-130mm",
          "Material: Iron or brass"
        ]
      },
      { 
        event: "Discus",
        specs: [
          "High School Boys: 1.6 kg (3.5 lb)",
          "High School Girls: 1 kg (2.2 lb)",
          "Diameter: 219-221mm (boys), 180-182mm (girls)",
          "Material: Wood or plastic with metal rim"
        ]
      },
      { 
        event: "Javelin",
        specs: [
          "High School Boys: 800g (1.76 lb)",
          "High School Girls: 600g (1.32 lb)",
          "Length: 2.6-2.7m (boys), 2.2-2.3m (girls)",
          "Material: Metal shaft with cord grip"
        ]
      },
    ],
  },
  {
    id: "drills",
    title: "Common Drills Library",
    icon: Dumbbell,
    content: [
      {
        drill: "Power Position Throws",
        events: ["Shot", "Discus"],
        description: "Start from final power position, focus on block and drive through release. Builds explosive power and proper finish mechanics."
      },
      {
        drill: "South Africans",
        events: ["Shot"],
        description: "Standing throw with feet together, emphasizing chest drive and arm extension. Develops upper body power and coordination."
      },
      {
        drill: "Impulse Steps",
        events: ["Discus"],
        description: "Quick rhythm steps to build momentum and timing. Helps develop smooth transitions in the throwing motion."
      },
      {
        drill: "External Rotation Series",
        events: ["Javelin"],
        description: "Shoulder strengthening and mobility exercises. Critical for arm health and throwing efficiency."
      },
      {
        drill: "Medicine Ball Work",
        events: ["Shot", "Discus", "Javelin"],
        description: "Overhead throws, chest passes, rotational throws. Develops core strength and explosive power."
      },
    ],
  },
  {
    id: "principles",
    title: "Training Principles",
    icon: Info,
    content: [
      {
        principle: "Progressive Overload",
        description: "Gradually increase training volume and intensity over the season. Start with technical work and build to full efforts."
      },
      {
        principle: "Specificity",
        description: "Training should mimic competition demands. More full throws as season progresses, technical work maintains throughout."
      },
      {
        principle: "Recovery",
        description: "Throwing is high-intensity. Indoor/recovery days are essential. Respect fatigue, especially in javelin (arm health)."
      },
      {
        principle: "Technical Foundation",
        description: "Master basics before adding complexity. Quality over quantity. Bad reps reinforce bad habits."
      },
      {
        principle: "Periodization",
        description: "Season divided into phases: Base (technical), Build (volume), Competition (intensity), Taper (peak)."
      },
    ],
  },
  {
    id: "safety",
    title: "Safety Guidelines",
    icon: Shield,
    content: [
      {
        category: "General Safety",
        rules: [
          "Always warm up properly before throwing",
          "Never throw without coach supervision",
          "Check throwing area is clear before each throw",
          "Retrieve implements only when coach signals all-clear",
          "Report any pain or discomfort immediately"
        ]
      },
      {
        category: "Javelin Specific",
        rules: [
          "Never exceed recommended weekly throw volume",
          "Stop immediately if shoulder/elbow pain occurs",
          "Carry javelin point-down when walking",
          "Never throw javelin without spotter",
          "Track weekly throw count religiously"
        ]
      },
      {
        category: "Shot Put & Discus",
        rules: [
          "Clear the ring completely before next thrower enters",
          "Check toe board and ring for damage before use",
          "Never throw outside designated throwing sector",
          "Use proper lifting technique when handling implements",
          "Wipe implements if wet or slippery"
        ]
      },
    ],
  },
];

export default function Appendix() {
  const [activeSection, setActiveSection] = useState("abbreviations");

  const currentSection = sections.find((s) => s.id === activeSection);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 mb-6">
          <div className="flex items-center gap-3">
            <Scroll className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Program Appendix</h1>
          </div>
          <p className="text-slate-300 mt-2">Reference materials and resources</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-4">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-600 uppercase tracking-wide">
                  Contents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                        activeSection === section.id
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{section.title}</span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  {React.createElement(currentSection.icon, {
                    className: "w-6 h-6 text-blue-600",
                  })}
                  <CardTitle className="text-2xl">{currentSection.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Abbreviations Section */}
                {activeSection === "abbreviations" && (
                  <div className="space-y-4">
                    {currentSection.content.map((item) => (
                      <div
                        key={item.term}
                        className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-baseline gap-3 mb-1">
                          <span className="font-mono text-lg font-bold text-blue-600">
                            {item.term}
                          </span>
                          <span className="text-slate-700 font-semibold">
                            {item.definition}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 ml-1">{item.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Implements Section */}
                {activeSection === "implements" && (
                  <div className="space-y-6">
                    {currentSection.content.map((item) => (
                      <div key={item.event} className="space-y-3">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          {item.event === "Shot Put" && "🏋️"}
                          {item.event === "Discus" && "🥏"}
                          {item.event === "Javelin" && "🎯"}
                          {item.event}
                        </h3>
                        <ul className="space-y-2">
                          {item.specs.map((spec, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                            >
                              <span className="text-blue-600 font-bold">•</span>
                              <span className="text-slate-700">{spec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drills Section */}
                {activeSection === "drills" && (
                  <div className="space-y-4">
                    {currentSection.content.map((item) => (
                      <div
                        key={item.drill}
                        className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                          {item.drill}
                        </h3>
                        <div className="flex gap-2 mb-3">
                          {item.events.map((event) => (
                            <span
                              key={event}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                            >
                              {event}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-slate-600">{item.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Training Principles Section */}
                {activeSection === "principles" && (
                  <div className="space-y-4">
                    {currentSection.content.map((item) => (
                      <div
                        key={item.principle}
                        className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                          {item.principle}
                        </h3>
                        <p className="text-slate-700">{item.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Safety Section */}
                {activeSection === "safety" && (
                  <div className="space-y-6">
                    {currentSection.content.map((item) => (
                      <div key={item.category} className="space-y-3">
                        <h3 className="text-xl font-bold text-red-900 flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          {item.category}
                        </h3>
                        <ul className="space-y-2">
                          {item.rules.map((rule, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
                            >
                              <span className="text-red-600 font-bold">•</span>
                              <span className="text-slate-700">{rule}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}