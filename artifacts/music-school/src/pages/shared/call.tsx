import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Loader2, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppClasses } from "@/hooks/use-app-classes";
import { useAppAuth } from "@/hooks/use-app-auth";

export default function Call() {
  const params = useParams();
  const classId = params.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const { classes, updateClass } = useAppClasses();
  const { user } = useAppAuth();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const classInfo = classes.find(c => c.id === classId);

  useEffect(() => {
    // If teacher joins, automatically mark as ongoing if it's currently scheduled
    if (user?.role === "teacher" && classInfo && classInfo.status === "scheduled") {
      updateClass({ classId, data: { status: "ongoing" } });
    }
  }, [user, classInfo, classId, updateClass]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!classInfo) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading virtual studio...</p>
      </div>
    );
  }

  const roomName = `MaestroAcademy-${classId}-${classInfo.title.replace(/\s+/g, '')}`;
  
  // Construct Jitsi URL with parameters optimized for music/teaching
  const jitsiUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&config.disableDeepLinking=true&userInfo.displayName=${encodeURIComponent(user?.name || '')}&config.p2p.enabled=false&config.enableNoAudioDetection=false&config.enableNoisyMicDetection=false`;

  return (
    <div ref={containerRef} className="min-h-screen bg-black flex flex-col relative w-full h-screen">
      {/* Custom Header overlays iframe */}
      <div className={`absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center justify-between px-6 transition-transform duration-300 ${isFullscreen ? '-translate-y-full hover:translate-y-0' : ''}`}>
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 rounded-full"
            onClick={() => setLocation(`/${user?.role}/classes`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-white font-semibold text-lg drop-shadow-md">{classInfo.title}</h1>
            <p className="text-white/70 text-xs">{classInfo.topic}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {user?.role === "teacher" && (
            <Button 
              size="sm" 
              variant="destructive" 
              className="h-8 text-xs font-semibold px-4"
              onClick={async () => {
                if(confirm("End class for everyone?")) {
                  await updateClass({ classId, data: { status: "completed" } });
                  setLocation("/teacher/classes");
                }
              }}
            >
              End Class
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 rounded-full"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Main Jitsi Iframe */}
      <div className="flex-1 w-full h-full">
        <iframe 
          src={jitsiUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-full border-0 bg-zinc-900"
          title="Virtual Studio"
        />
      </div>
    </div>
  );
}
