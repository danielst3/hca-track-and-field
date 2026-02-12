import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scroll, Book, Dumbbell, Info, Shield, Target, Activity, Plus, ExternalLink, FileText, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { drillsDatabase } from "../components/data/drillsDatabase";
import EditResourceDialog from "../components/resources/EditResourceDialog";

const customSection = {
  id: "custom-resources",
  title: "Team Resources",
  icon: FileText,
};

const sections = [
  customSection,
  {
    id: "abbreviations",
    title: "Abbreviations & Terminology",
    icon: Book,
  },
  {
    id: "drills-warmup",
    title: "Warm-Up & Prep",
    icon: Activity,
  },
  {
    id: "drills-shot",
    title: "Shot Put Drills",
    icon: Dumbbell,
  },
  {
    id: "drills-discus",
    title: "Discus Drills",
    icon: Dumbbell,
  },
  {
    id: "drills-javelin",
    title: "Javelin Drills",
    icon: Dumbbell,
  },
  {
    id: "drills-strength",
    title: "Strength Training",
    icon: Dumbbell,
  },
  {
    id: "drills-prehab",
    title: "Prehab & Mobility",
    icon: Activity,
  },
  {
    id: "implements",
    title: "Implement Specifications",
    icon: Target,
  },
  {
    id: "principles",
    title: "Training Principles",
    icon: Info,
  },
  {
    id: "safety",
    title: "Safety Guidelines",
    icon: Shield,
  },
];

const abbreviations = [
  { term: "PP", definition: "Power Position", description: "The final throwing position before release" },
  { term: "FT", definition: "Full Throw", description: "Complete throwing motion from start to finish" },
  { term: "SA", definition: "South African", description: "A specific drill technique for discus and shot" },
  { term: "IS", definition: "Impulse Step", description: "Quick stepping drill for rhythm development" },
  { term: "MB", definition: "Medicine Ball", description: "Weighted ball used for power development" },
  { term: "ER", definition: "External Rotation", description: "Shoulder rotation exercise for javelin" },
  { term: "TQ", definition: "Technical Quality throws", description: "Focus on form over distance" },
  { term: "Lift-H", definition: "Heavy Lift Day", description: "Strength emphasis in weight room" },
  { term: "Lift-P", definition: "Power Lift Day", description: "Explosive/power emphasis in weight room" },
];

const implementSpecs = [
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
];

const principles = [
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
];

const safety = [
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
];

export default function Resources() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState("abbreviations");
  const [expandedDrill, setExpandedDrill] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: customResources = [] } = useQuery({
    queryKey: ["resources"],
    queryFn: () => base44.entities.Resource.list(),
  });

  const isCoach = user?.role === "admin";

  const handleAddResource = () => {
    setSelectedResource(null);
    setEditDialogOpen(true);
  };

  const handleEditResource = (resource) => {
    setSelectedResource(resource);
    setEditDialogOpen(true);
  };

  const getDrillsByCategory = (category) => {
    return drillsDatabase.filter(d => d.category === category);
  };

  const renderDrillCard = (drill, index) => (
    <div key={index} className="border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpandedDrill(expandedDrill === index ? null : index)}
        className="w-full p-4 bg-slate-50 dark:bg-gray-900 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100">{drill.name}</h3>
        {drill.purpose && (
          <p className="text-sm text-slate-600 dark:text-gray-300 mt-1">{drill.purpose}</p>
        )}
      </button>
      
      {expandedDrill === index && (
        <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
          {drill.setup && (
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Setup:</p>
              <p className="text-sm text-slate-600 dark:text-gray-400">{drill.setup}</p>
            </div>
          )}
          
          {drill.executionSteps && drill.executionSteps.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Execution:</p>
              <ol className="space-y-2">
                {drill.executionSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-gray-400">
                    <span className="font-semibold text-blue-600 dark:text-blue-400 min-w-[20px]">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          
          {drill.cues && drill.cues.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Coaching Cues:</p>
              <div className="flex flex-wrap gap-2">
                {drill.cues.map((cue, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm rounded-full font-medium"
                  >
                    "{cue}"
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {drill.commonFaultsFixes && drill.commonFaultsFixes.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">Common Faults & Fixes:</p>
              <div className="space-y-2">
                {drill.commonFaultsFixes.map((item, idx) => (
                  <div key={idx} className="p-2 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800 text-sm">
                    <span className="text-slate-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-gray-950 dark:to-gray-900 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Scroll className="w-8 h-8 text-blue-400 dark:text-blue-300" />
                <h1 className="text-3xl font-bold text-white dark:text-gray-100">Resources</h1>
              </div>
              <p className="text-slate-300 dark:text-gray-400 mt-2">Training reference guide and drill library</p>
            </div>
            {isCoach && (
              <Button
                onClick={handleAddResource}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Resource
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-4">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-600 dark:text-gray-400 uppercase tracking-wide">
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
                          ? "bg-blue-600 text-white shadow-md dark:bg-blue-700"
                          : "text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
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
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="border-b dark:border-gray-700">
                <CardTitle className="text-2xl dark:text-gray-100">
                  {sections.find(s => s.id === activeSection)?.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Custom Resources */}
                {activeSection === "custom-resources" && (
                  <div className="space-y-4">
                    {customResources.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-slate-600 dark:text-gray-300">No custom resources yet</p>
                        {isCoach && (
                          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                            Click "Add Resource" to create your first one
                          </p>
                        )}
                      </div>
                    ) : (
                      customResources.map((resource) => (
                        <div
                          key={resource.id}
                          className="p-4 bg-slate-50 dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg text-slate-900 dark:text-gray-100 mb-2">
                                {resource.title}
                              </h3>
                              {resource.content && (
                                <p className="text-sm text-slate-600 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                                  {resource.content}
                                </p>
                              )}
                              <div className="flex gap-2">
                                {resource.link_url && (
                                  <a
                                    href={resource.link_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Open Link
                                  </a>
                                )}
                                {resource.file_url && (
                                  <a
                                    href={resource.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <FileText className="w-3 h-3" />
                                    View File
                                  </a>
                                )}
                              </div>
                            </div>
                            {isCoach && (
                              <Button
                                onClick={() => handleEditResource(resource)}
                                size="sm"
                                variant="ghost"
                                className="ml-2 dark:text-gray-300 dark:hover:bg-gray-800"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Abbreviations */}
                {activeSection === "abbreviations" && (
                  <div className="space-y-4">
                    {abbreviations.map((item) => (
                      <div
                        key={item.term}
                        className="p-4 bg-slate-50 dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-700"
                      >
                        <div className="flex items-baseline gap-3 mb-1">
                          <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                            {item.term}
                          </span>
                          <span className="text-slate-700 dark:text-gray-300 font-semibold">
                            {item.definition}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-gray-400 ml-1">{item.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drill Sections */}
                {activeSection === "drills-warmup" && (
                  <div className="space-y-4">
                    {getDrillsByCategory("Warm-up").map((drill, idx) => renderDrillCard(drill, idx))}
                  </div>
                )}
                
                {activeSection === "drills-shot" && (
                  <div className="space-y-4">
                    {getDrillsByCategory("Shot").map((drill, idx) => renderDrillCard(drill, idx))}
                  </div>
                )}
                
                {activeSection === "drills-discus" && (
                  <div className="space-y-4">
                    {getDrillsByCategory("Discus").map((drill, idx) => renderDrillCard(drill, idx))}
                  </div>
                )}
                
                {activeSection === "drills-javelin" && (
                  <div className="space-y-4">
                    {getDrillsByCategory("Javelin").map((drill, idx) => renderDrillCard(drill, idx))}
                  </div>
                )}
                
                {activeSection === "drills-strength" && (
                  <div className="space-y-4">
                    {getDrillsByCategory("Strength").map((drill, idx) => renderDrillCard(drill, idx))}
                  </div>
                )}
                
                {activeSection === "drills-prehab" && (
                  <div className="space-y-4">
                    {getDrillsByCategory("Prehab").map((drill, idx) => renderDrillCard(drill, idx))}
                  </div>
                )}

                {/* Implements */}
                {activeSection === "implements" && (
                  <div className="space-y-6">
                    {implementSpecs.map((item) => (
                      <div key={item.event} className="space-y-3">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-gray-100 flex items-center gap-2">
                          {item.event === "Shot Put" && "🏋️"}
                          {item.event === "Discus" && "🥏"}
                          {item.event === "Javelin" && "🎯"}
                          {item.event}
                        </h3>
                        <ul className="space-y-2">
                          {item.specs.map((spec, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-gray-900 rounded-lg"
                            >
                              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                              <span className="text-slate-700 dark:text-gray-300">{spec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Principles */}
                {activeSection === "principles" && (
                  <div className="space-y-4">
                    {principles.map((item) => (
                      <div
                        key={item.principle}
                        className="p-4 bg-slate-50 dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-700"
                      >
                        <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-2">
                          {item.principle}
                        </h3>
                        <p className="text-slate-700 dark:text-gray-300">{item.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Safety */}
                {activeSection === "safety" && (
                  <div className="space-y-6">
                    {safety.map((item) => (
                      <div key={item.category} className="space-y-3">
                        <h3 className="text-xl font-bold text-red-900 dark:text-red-400 flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          {item.category}
                        </h3>
                        <ul className="space-y-2">
                          {item.rules.map((rule, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800"
                            >
                              <span className="text-red-600 dark:text-red-400 font-bold">•</span>
                              <span className="text-slate-700 dark:text-gray-300">{rule}</span>
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

        <EditResourceDialog
          resource={selectedResource}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      </div>
    </div>
  );
}