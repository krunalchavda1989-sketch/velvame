import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";

interface SessionTimeoutDialogProps {
  open: boolean;
  countdown: number;
  onKeepAlive: () => void;
  onLogout: () => void;
}

const SessionTimeoutDialog = ({ open, countdown, onKeepAlive, onLogout }: SessionTimeoutDialogProps) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <Clock className="h-7 w-7 text-destructive" />
          </div>
          <AlertDialogTitle className="text-xl">Session Timeout</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Your session will expire due to inactivity. You will be logged out in{" "}
            <span className="font-bold text-destructive">{countdown}</span> seconds.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2 sm:justify-center">
          <Button variant="outline" onClick={onLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
          <Button onClick={onKeepAlive} className="gap-2">
            Keep Session Active
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SessionTimeoutDialog;
