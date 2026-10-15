'use client'

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { ApiResponse, Persona } from "@/lib/types/database";
import { renderToStaticMarkup } from "react-dom/server";
import ProgressBar from "@/components/ui/progress-bar";
import { Briefcase, Cake, GraduationCap, Heart, MapPin, RotateCcw, User, Trash2 } from "lucide-react";
import DottedRating from "@/components/ui/dotted-rating";
import BulletText from "@/components/ui/bullet-text";
import EditableField from "@/components/personas/editable_field";
import SaveToast from "@/components/ui/save-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeletePersona } from "@/lib/hooks/use-personas";
import { useToast } from "@/hooks/use-toast";

import styles from '@/components/personas/persona_detail_page.module.css';
import EditableDottedRating from "@/components/ui/editable-dotted-rating";
import EditableProgressBar from "@/components/ui/editable-progress-bar";
import BuzzwordEdit from "@/components/ui/buzzword-edit";
import BulletTextEditor from "@/components/ui/bullet-text-editor";

export default function PersonaDetailPage() {
  const params = useParams<{ projectId: string; personaId: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [persona, setPersona] = useState<Persona>();
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editablePersona, setEditablePersona] = useState({ ...persona });
  const [showToast, setShowToast] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteMutation = useDeletePersona(params.projectId);

  const [scale, setScale] = useState(1);

  var mult = 3.3;
  var height = 290 * mult;
  var width = 225 * mult;

  useEffect(() => {
    const updateScale = () => {
      const newScale = (window.innerHeight / height) * 0.75;
      setScale(newScale);
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [height]);


  const handleChange = (key: string, value: any) => {
    setEditablePersona((prev) => ({ ...prev, [key]: value }));
  };

  const isUnchanged = JSON.stringify(persona) === JSON.stringify(editablePersona);

  const handleCopyToOriginal = async () => {
    try {
      /* SAVE */
      await updatePersona(params.projectId, params.personaId, editablePersona);
      /* UPDATE */
      setPersona({ ...(editablePersona as Persona) });
      setShowToast(true);
    } catch {
      console.log("Error saving Persona")
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(params.personaId);
      toast({
        title: 'Success',
        description: 'Persona deleted successfully',
      });
      setShowDeleteDialog(false);
      router.push(`/projects/${params.projectId}/personas`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete persona',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!params?.projectId || !params?.personaId) return;

    setLoadingPersonas(true);
    fetchPersona(params.projectId, params.personaId)
      .then((fetchedPersona) => setPersona(fetchedPersona))
      .catch((err) => setError(err.message))
      .finally(() => {
        setLoadingPersonas(false);
      });
  }, [params.projectId, params.personaId]);

  useEffect(() => {
    if (persona) {
      setEditablePersona({ ...persona });
    }
  }, [persona]);

  if (loadingPersonas) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  const handlePrint = () => {
    console.log("To PDF");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    console.log(persona?.photo_url);

    const pdfHTML = renderToStaticMarkup(<PersonaPDF persona={editablePersona!} isPDF={true} />);

    //PDF-VERSION
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Persona-PDF</title>
          <link rel="stylesheet" href="/styles/persona-pdf.css" />
          </head>
        <body>
        ${pdfHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    const stylesheet = printWindow.document.querySelector('link[rel="stylesheet"]');

    stylesheet!.addEventListener("load", () => {
      printWindow.document.fonts.ready.then(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      });
    });

  };


  const tabs = ["Profile", "Overview", "Personality", "Motivation"];
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <ProfileTab persona={persona} editablePersona={editablePersona} handleChange={handleChange} />;
      case 1:
        return <OverviewTab persona={persona} editablePersona={editablePersona} handleChange={handleChange} />;
      case 2:
        return <PersonalityTab persona={persona} editablePersona={editablePersona} handleChange={handleChange} />;
      case 3:
        return <MotivationTab persona={persona} editablePersona={editablePersona} handleChange={handleChange} />;
      default:
        return null;
    }
  };

  return (
      <div className="flex w-full p-16">

        <div className="flex-1 p-5 pr-16">
        <div className="overflow-auto" style={{height: height * scale + "px"}}>

          {/* Tabs */}
          <div className="flex border-b border-gray-300 mb-4">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-4 py-2 -mb-px border-b-2 font-medium ${activeTab === index
                    ? "border-[#DC3C05] text-[#DC3C05]"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto">{renderTabContent()}</div>

          <SaveToast
            open={showToast}
            message="Persona saved"
            duration={3000}
            onClose={() => setShowToast(false)}
          />
        </div>

              <div className="flex justify-between items-center mt-4">
        {/* Left-aligned back button */}
        <BackButton/>

        {/* Right-aligned buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>

          <Button onClick={handlePrint} variant="ghost" size="sm">
            Download PDF
          </Button>

          <Button
            onClick={handleCopyToOriginal}
            disabled={isUnchanged}
            size="sm"
          >
            Save Changes
          </Button>
        </div>
      </div>

        </div>


        <div
          style={{
            width: width * scale + "px",
            height: "0px"
          }}
        >
          <div
            style={{
              width: width + "px",
              height: height + "px",
              backgroundColor: "white",
              padding: "30px",
              color: "black",
              boxShadow: "20px 20px 0px 0px rgba(200, 200, 200, 1)",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              boxSizing: "border-box",
            }}
          >
            <PersonaPDF persona={editablePersona!} />
          </div>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Persona</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{persona?.name}&quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}


async function fetchPersona(projectId: string, personaId: string): Promise<Persona> {
    const res = await fetch(`/api/projects/${projectId}/personas/${personaId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch personas');
    }
    const data: ApiResponse<Persona> = await res.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.data!;
  }


function PersonaPDF({ persona, isPDF = false }: { persona: any, isPDF?: boolean }) {
  if (!persona) return;
  const items = [
    { Icon: Cake, label: persona.age },
    { Icon: MapPin, label: persona.location },
    { Icon: Briefcase, label: persona.occupation },
    { Icon: GraduationCap, label: persona.education },
    { Icon: User, label: persona.gender },
    { Icon: Heart, label: persona.relationship_status },
  ];

  const rootRef = useRef<HTMLDivElement>(null);

  const [buzzwordOverflow, setBuzzwordOverflow] = useState(false);
  const [motivationsOverflow, setMotivationsOverflow] = useState(false);
  const [goalsOverflow, setGoalsOverflow] = useState(false);
  const [painPointsOverflow, setPainPoints] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const elements = Array.from(root.querySelectorAll<HTMLElement>("div"));

    let overflowCount = 0;
    let buzzwordHasOverflow = false;
    let motivationHasOverflow = false;
    let goalsHasOverflow = false;
    let painPointsHasOverflow = false;


    elements.forEach((el) => {
      const style = getComputedStyle(el);

      if (style.overflow === "hidden" || style.overflowY === "hidden") {
        const hasOverflow = el.scrollHeight > el.clientHeight;

        if (hasOverflow) {
          overflowCount++;

          if (el.className === "BuzzwordDiv") {
            buzzwordHasOverflow = true;
          }
          if (el.className === "MotivationDiv") {
            motivationHasOverflow = true;
          }
          if (el.className === "GoalsDiv") {
            goalsHasOverflow = true;
          }
          if (el.className === "PainPointsDiv") {
            painPointsHasOverflow = true;
          }
        }
      }
    });

    setBuzzwordOverflow(buzzwordHasOverflow);
    setMotivationsOverflow(motivationHasOverflow);
    setGoalsOverflow(goalsHasOverflow);
    setPainPoints(painPointsHasOverflow);
  }, [persona]);



  return (
    <div
      ref={rootRef}
      style={{
        display: "flex",
        height: "100%",
        fontFamily: "Unit Slab Light",
        fontWeight: 400,
        fontSize: "17px"
      }}
    >
      {/* Left Column */}
      <div
        style={{
          flex: 1,
          padding: "20px",
        }}
      >
        {persona.photo_url && (
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <img
              src={persona.photo_url}
              alt={persona.name}
              style={{
                width: "200px",
                height: "200px",
                objectFit: "cover",
                borderRadius: "50%",
                marginBottom: "16px",
              }}
            />
          </div>
        )}

        <h1 style={
          {
            fontFamily: '"Unit Slab Bold Italic"',
            fontWeight: 400,
            fontSize: "33px"
          }}
        >{persona.name}</h1>
        <h2
          style={{
            color: "#DC3C05"
          }}
          className={styles.unitMedium}
        >{persona.role}</h2>


        <h2 className={styles.unitMedium}>About</h2>

        <div className={`${isPDF ? 'profile-grid' : styles.profileGrid}`}>
          {items.map(({ Icon, label }, index) => (
            <div className={`${isPDF ? 'profile-item' : styles.profileItem}`}
              key={index}>
              <div className={`${isPDF ? 'icon-circle' : styles.iconCircle}`}>
                <Icon size={20} />
              </div>
              <div style={{ maxHeight: "60px" }}>
                <span>{label}</span>
              </div>
            </div>
          ))}
        </div>

        {buzzwordOverflow && (<div style={{ height: "3px", marginTop: "10px" }} >
          <span
            style={{
              border: "1px solid #DC3C05",
              borderRadius: "9999px",
              padding: "2px 10px",
              fontSize: "12px",
              color: "#DC3C05",
              whiteSpace: "nowrap",
            }}
          >
            Warning: too many points
          </span>
        </div>)}

        <div className="BuzzwordDiv" style={{ marginTop: "30px", height: "95px", overflow: "hidden" }}>
          {persona.buzzwords?.filter(Boolean).map((buzzword: string | null | undefined, index: number | null | undefined) => (
            <div key={index} className={`${isPDF ? 'buzzwords' : styles.buzzwords}`}>
              {buzzword}
            </div>
          ))}
        </div>

        <h2 className={styles.unitMedium}>Personality</h2>

        <ProgressBar style={{ marginBottom: "20px" }} progress={persona.personality_01} leftLabel="Introvert" rightLabel="Extrovert" height="12px" />
        <ProgressBar style={{ marginBottom: "20px" }} progress={persona.personality_02} leftLabel="Thinking" rightLabel="Feeling" height="12px" />
        <ProgressBar style={{ marginBottom: "20px" }} progress={persona.personality_03} leftLabel="Intuitive" rightLabel="Observant" height="12px" />
        <ProgressBar progress={persona.personality_04} leftLabel="Independent" rightLabel="Team player" height="12px" />

      </div>


      {/* Divider */}
      <div
        style={{
          width: "2px",
          backgroundColor: "#D8D7D7",
          borderRadius: "9999px",
          alignSelf: "stretch",
          margin: "0 10px",
        }}
      ></div>


      {/* Right Column */}
      <div
        className="rightSide"
        style={{
          flex: 1,
          padding: "20px",
          paddingTop: "10px"
        }}
      >

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h2 className={styles.unitMedium}>Motivations</h2>
          {motivationsOverflow && (
            <span
              style={{
                border: "1px solid #DC3C05",
                borderRadius: "9999px",
                padding: "2px 10px",
                fontSize: "12px",
                color: "#DC3C05",
                whiteSpace: "nowrap",
              }}
            >
              Warning: text too long
            </span>)}
        </div>
        <div className="MotivationDiv" style={{ maxHeight: "275px", width: "280px", overflow: "hidden" }}>
          <p style={{ fontSize: "20px" }}>{persona.motivation}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h2 className={styles.unitMedium}>Goals</h2>
          {goalsOverflow && (
            <span
              style={{
                border: "1px solid #DC3C05",
                borderRadius: "9999px",
                padding: "2px 10px",
                fontSize: "12px",
                color: "#DC3C05",
                whiteSpace: "nowrap",
              }}
            >
              Warning: too many points
            </span>)}
        </div>

        <div className="GoalsDiv" style={{ fontSize: "20px", maxHeight: "108px", overflow: "hidden" }}>
          {persona.goals?.filter(Boolean).map((goal: string) => (
            <BulletText key={goal} text={goal} />
          ))}

        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h2 className={styles.unitMedium}>Pain Points</h2>
          {painPointsOverflow && (
            <span
              style={{
                border: "1px solid #DC3C05",
                borderRadius: "9999px",
                padding: "2px 10px",
                fontSize: "12px",
                color: "#DC3C05",
                whiteSpace: "nowrap",
              }}
            >
              Warning: too many points
            </span>)}
        </div>

        <div className="PainPointsDiv" style={{ fontSize: "20px", maxHeight: "168px", overflow: "hidden" }}>
          {persona.pain_points?.filter(Boolean).map((point: string) => (
            <BulletText key={point} text={point} />
          ))}

        </div>

        <h2 className={styles.unitMedium}>Technical Skills</h2>
        <DottedRating style={{ marginBottom: "20px" }} progress={persona.skill_01} leftLabel="Domain Knowledge" height="20px" />
        <DottedRating style={{ marginBottom: "20px" }} progress={persona.skill_02} leftLabel="Technology Proficiency" height="20px" />
        <DottedRating progress={persona.skill_03} leftLabel="Adaptability" height="20px" />

      </div>
    </div>
  );
}
  

  async function updatePersona(projectId: string, personaId: string, updatedData: any) {
    const response = await fetch(`/api/projects/${projectId}/personas/${personaId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update persona: ${errorText}`);
    }
  
    return response.json();
  }


  function ProfileTab({ persona,editablePersona,handleChange }: { persona: any,editablePersona:any,handleChange:any }){
    if(!persona)return;

    const [customUrl, setCustomURL] = useState<string>();
    const [isValidImage, setIsValidImage] = useState<boolean>(true);

    useEffect(() => {
      if (!customUrl) {
        setIsValidImage(false);
        return;
      }

      const img = new Image();
      img.src = customUrl;
      img.onload = () => setIsValidImage(true);
      img.onerror = () => setIsValidImage(false);
    }, [customUrl]);

    useEffect(() => {
      if (persona.photo_url && !persona.photo_url.startsWith("/persona_default_images/")) {
        setCustomURL(persona.photo_url);
      } else {
        setCustomURL(undefined);
      }
    }, [persona.photo_url]);

    const defaultImages = [
      "young_man_tone0",
      "young_man_tone1",
      "young_man_tone2",
      "young_woman_tone0",
      "young_woman_tone1",
      "young_woman_tone2",
      "adult_man_tone0",
      "adult_man_tone1",
      "adult_man_tone2",
      "adult_woman_tone0",
      "adult_woman_tone1",
      "adult_woman_tone2",
      "old_man_tone0",
      "old_man_tone1",
      "old_man_tone2",
      "old_woman_tone0",
      "old_woman_tone1",
      "old_woman_tone2",
    ];

    const fallbackImage =
    "https://img.freepik.com/vektoren-kostenlos/blauer-kreis-mit-weissem-benutzer_78370-4707.jpg?semt=ais_hybrid&w=740&q=80";

    return <>
      <div className="h-full">
        <div className="grid grid-cols-6 gap-4">
          {defaultImages.map((img) => {
            const url = `/persona_default_images/${img}.png`;

            return (
              <button
                key={img}
                onClick={() => handleChange("photo_url", url)}
                className={`p-1 transition hover:opacity-80 rounded-full
          ${editablePersona.photo_url === url ? "border-2 [border-color:#DC3C05]" : "border-2 border-transparent"}`}
              >
                <div className="aspect-square w-full rounded-full overflow-hidden">
                  <img
                    src={url}
                    alt={img}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </button>
            );
          })}
        </div>


        <div className="flex items-center gap-4 pt-5">
          <button
            key={customUrl}
            disabled={!isValidImage}
            onClick={() => isValidImage && handleChange("photo_url", customUrl)}
            className={`
      p-1 transition rounded-full flex-shrink-0
      ${isValidImage ? "hover:opacity-80 cursor-pointer" : "opacity-40 cursor-not-allowed"}
      ${editablePersona.photo_url === customUrl && isValidImage
                ? "border-2 [border-color:#DC3C05]"
                : "border-2 border-transparent"
              }
    `}
            style={{ width: "calc((100% - 5 * 1rem) / 6)" }}
          >
            <div className="aspect-square rounded-full overflow-hidden">
              <img
                src={isValidImage && customUrl ? customUrl : fallbackImage}
                alt="custom avatar"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </button>

          <input
            type="text"
            value={customUrl || ""}
            onChange={(e) => setCustomURL(e.target.value)}
            className="border p-2 w-full rounded"
            placeholder="Custom URL"
          />

                <button
                  type="button"
                  onClick={() => handleChange("photo_url", persona?.photo_url)}
                  disabled={editablePersona.photo_url === persona?.photo_url}
                  className={`border rounded-full p-2 transition ${editablePersona.photo_url === persona?.photo_url
                    ? "hidden"
                    : "bg-transparent hover:bg-gray-700"}`}
                  title="Reset"
                >
                  <RotateCcw size={16} />
                </button>
        </div>

      </div>
    </>;
  }

  function MotivationTab({ persona,editablePersona,handleChange }: { persona: any,editablePersona:any,handleChange:any }){
    const painPointEqual =
      JSON.stringify(editablePersona.pain_points) ===
      JSON.stringify(persona?.pain_points);

      const goalsEqual =
      JSON.stringify(editablePersona.goals) ===
      JSON.stringify(persona?.goals);
      
    return <>
    <div className="h-full">
    <div className="p-4">
      <label className="block mb-2">
        Motivation:

            <div className="flex items-center w-full">
              <div className="flex-1">
                <textarea
                  value={editablePersona.motivation || ""}
                  onChange={(e) => handleChange("motivation", e.target.value)}
                  className="border w-full p-2 resize-none overflow-auto h-30"
                  maxLength={370}
                />
              </div>
              <button type="button"
                onClick={() => handleChange("motivation", persona?.motivation)}
                disabled={editablePersona.motivation === persona?.motivation}
                className={`border rounded-full p-2 transition ml-3 ${editablePersona.motivation === persona?.motivation
                  ? "hidden"
                  : "bg-transparent hover:bg-gray-700"}`}
                title="Reset">
                <RotateCcw size={16} />
              </button>
            </div>

          </label>
        </div>

        <div className="p-4">
          <label className="block mb-2">
            Goals:

            <div className="flex items-start w-full">
              <div className="flex-1">
                <BulletTextEditor
                  items={editablePersona.goals}
                  placeholder="Enter Goal"
                  handleChange={handleChange}
                  fieldKey="goals"
                />
              </div>
              <button
                type="button"
                onClick={() => handleChange("goals", persona?.goals)}
                disabled={editablePersona.goals === persona?.goals}
                className={`border rounded-full p-3 transition ml-3 self-start ${goalsEqual
                  ? "hidden"
                  : "bg-transparent hover:bg-gray-700"
                  }`}
                title="Reset"
              >
                <RotateCcw size={16} />
              </button>
            </div>

          </label>
        </div>

        <div className="p-4">
          <label className="block mb-2">
            Pain-Points:

            <div className="flex items-start w-full">
              <div className="flex-1">
                <BulletTextEditor
                  items={editablePersona.pain_points}
                  placeholder="Enter Pain-Point"
                  handleChange={handleChange}
                  fieldKey="pain_points"
                />
              </div>
              <button
                type="button"
                onClick={() => handleChange("pain_points", persona?.pain_points)}
                disabled={editablePersona.pain_points === persona?.pain_points}
                className={`border rounded-full p-3 transition ml-3 self-start ${painPointEqual 
                  ? "hidden"
                  : "bg-transparent hover:bg-gray-700"
                  }`}
                title="Reset"
              >
                <RotateCcw size={16} />
              </button>
            </div>

          </label>
        </div>

      </div>
      </>
  }
  
function PersonalityTab({ persona, editablePersona, handleChange }: { persona: any, editablePersona: any, handleChange: any }) {
  return <>
  <div className="h-full">
    <div className="w-full p-4">
      <label className="block mb-2">
        Buzzwords:
        <BuzzwordEdit
          buzzwords={editablePersona.buzzwords}
          handleChange={handleChange}
          persona={persona}
          editablePersona={editablePersona}
        />
      </label>

        <div className="flex items-center w-full">
          <div className="flex-1">
            <EditableProgressBar
              progress={editablePersona.personality_01}
              onChange={(e) => handleChange(`personality_01`, Number(e))}
              leftLabel="Introvert"
              rightLabel="Extrovert"
            />
          </div>
          <button type="button"
            onClick={() => handleChange("personality_01", persona?.personality_01)}
            disabled={editablePersona.personality_01 === persona?.personality_01}
            className={`border rounded-full p-2 transition ml-3 ${editablePersona.personality_01 === persona?.personality_01
              ? "bg-transparent opacity-50"
              : "bg-transparent hover:bg-gray-700"}`}
            title="Reset">
            <RotateCcw size={16} />
          </button>
        </div>

        <div className="flex items-center w-full" style={{ marginTop: "20px" }}>
          <div className="flex-1">
            <EditableProgressBar
              progress={editablePersona.personality_02}
              onChange={(e) => handleChange(`personality_02`, Number(e))}
              leftLabel="Thinking"
              rightLabel="Feeling"
            />
          </div>
          <button type="button"
            onClick={() => handleChange("personality_02", persona?.personality_02)}
            disabled={editablePersona.personality_02 === persona?.personality_02}
            className={`border rounded-full p-2 transition ml-3 ${editablePersona.personality_02 === persona?.personality_02
              ? "bg-transparent opacity-50"
              : "bg-transparent hover:bg-gray-700"}`}
            title="Reset">
            <RotateCcw size={16} />
          </button>
        </div>

        <div className="flex items-center w-full" style={{ marginTop: "20px" }}>
          <div className="flex-1">
            <EditableProgressBar
              progress={editablePersona.personality_03}
              onChange={(e) => handleChange(`personality_03`, Number(e))}
              leftLabel="Intuitive"
              rightLabel="Observant"
            />
          </div>
          <button type="button"
            onClick={() => handleChange("personality_03", persona?.personality_03)}
            disabled={editablePersona.personality_03 === persona?.personality_03}
            className={`border rounded-full p-2 transition ml-3 ${editablePersona.personality_03 === persona?.personality_03
              ? "bg-transparent opacity-50"
              : "bg-transparent hover:bg-gray-700"}`}
            title="Reset">
            <RotateCcw size={16} />
          </button>
        </div>

        <div className="flex items-center w-full" style={{ marginTop: "20px", marginBottom: "50px" }}>
          <div className="flex-1">
            <EditableProgressBar
              progress={editablePersona.personality_04}
              onChange={(e) => handleChange(`personality_04`, Number(e))}
              leftLabel="Independent"
              rightLabel="Team player"

            />
          </div>
          <button type="button"
            onClick={() => handleChange("personality_04", persona?.personality_04)}
            disabled={editablePersona.personality_04 === persona?.personality_04}
            className={`border rounded-full p-2 transition ml-3 ${editablePersona.personality_04 === persona?.personality_04
              ? "bg-transparent opacity-50"
              : "bg-transparent hover:bg-gray-700"}`}
            title="Reset">
            <RotateCcw size={16} />
          </button>
        </div>


        <div className="flex items-center w-full">
          <div className="flex-1">
            <EditableDottedRating
              value={editablePersona.skill_01}
              onChange={(e) => handleChange(`skill_01`, Number(e))}
              leftLabel="Domain Knowledge"
            />
          </div>
          <button type="button"
            onClick={() => handleChange("skill_01", persona?.skill_01)}
            disabled={editablePersona.skill_01 === persona?.skill_01}
            className={`border rounded-full p-2 transition ml-3 ${editablePersona.skill_01 === persona?.skill_01
              ? "bg-transparent opacity-50"
              : "bg-transparent hover:bg-gray-700"}`}
            title="Reset">
            <RotateCcw size={16} />
          </button>
        </div>

        <div className="flex items-center w-full">
          <div className="flex-1">
            <EditableDottedRating
              value={editablePersona.skill_02}
              onChange={(e) => handleChange(`skill_02`, Number(e))}
              leftLabel="Technology Proficiency"
            />
          </div>
          <button type="button"
            onClick={() => handleChange("skill_02", persona?.skill_02)}
            disabled={editablePersona.skill_02 === persona?.skill_02}
            className={`border rounded-full p-2 transition ml-3 ${editablePersona.skill_02 === persona?.skill_02
              ? "bg-transparent opacity-50"
              : "bg-transparent hover:bg-gray-700"}`}
            title="Reset">
            <RotateCcw size={16} />
          </button>
        </div>

        <div className="flex items-center w-full">
          <div className="flex-1">
            <EditableDottedRating
              value={editablePersona.skill_03}
              onChange={(e) => handleChange(`skill_03`, Number(e))}
              leftLabel="Adaptability"
            />
          </div>
          <button type="button"
            onClick={() => handleChange("skill_03", persona?.skill_03)}
            disabled={editablePersona.skill_03 === persona?.skill_03}
            className={`border rounded-full p-2 transition ml-3 ${editablePersona.skill_03 === persona?.skill_03
              ? "bg-transparent opacity-50"
              : "bg-transparent hover:bg-gray-700"}`}
            title="Reset">
            <RotateCcw size={16} />
          </button>
        </div>
     
    </div>
    </div>
  </>
}
function OverviewTab({ persona, editablePersona, handleChange }: { persona: any, editablePersona: any, handleChange: any }) {
  return <>
    <div className="flex-1 overflow-auto">
      <div className="p-4">
        <h1 className="text-lg font-bold">Bio</h1>

        <div className="flex w-full">
          <div className="w-1/2 pr-4">

            <div className="w-full">
              <label className="block mb-1">Name</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={18}
                  value={editablePersona.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="border p-1 w-full rounded" />
                <button
                  type="button"
                  onClick={() => handleChange("name", persona?.name)}
                  disabled={editablePersona.name === persona?.name}
                  className={`border rounded-full p-2 transition ${editablePersona.name === persona?.name
                    ? "hidden"
                    : "bg-transparent hover:bg-gray-700"}`}
                  title="Reset"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

          </div>
          <div className="w-1/2 pl-4">
            <div className="w-full">
              <label className="block mb-1">Persona-Role</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={28}
                  value={editablePersona.role || ""}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="border p-1 w-full rounded" />
                <button
                  type="button"
                  onClick={() => handleChange("role", persona?.role)}
                  className={`border rounded-full p-2 transition ${editablePersona.role === persona?.role
                    ? "hidden"
                    : "bg-transparent hover:bg-gray-700"}`}
                  title="Reset"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex divide-x w-full pt-4">
          <div className="w-1/2 pr-4">
            <EditableField
              label="Age"
              icon={Cake}
              field="age"
              type="number"
              editablePersona={editablePersona}
              persona={persona}
              handleChange={handleChange} />
            <EditableField
              label="Occupation"
              icon={Briefcase}
              field="occupation"
              editablePersona={editablePersona}
              persona={persona}
              handleChange={handleChange} />
            <EditableField
              label="Gender"
              icon={User}
              field="gender"
              editablePersona={editablePersona}
              persona={persona}
              handleChange={handleChange} />
          </div>
          <div className="w-1/2 pl-4">
            <EditableField
              label="Location"
              icon={MapPin}
              field="location"
              editablePersona={editablePersona}
              persona={persona}
              handleChange={handleChange} />
            <EditableField
              label="Education"
              icon={GraduationCap}
              field="education"
              editablePersona={editablePersona}
              persona={persona}
              handleChange={handleChange} />
            <EditableField
              label="Relationship-Status"
              icon={Heart}
              field="relationship_status"
              editablePersona={editablePersona}
              persona={persona}
              handleChange={handleChange} />
          </div>
        </div>
      </div>
    </div>
  </>
}