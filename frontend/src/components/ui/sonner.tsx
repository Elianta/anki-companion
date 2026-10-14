import {
  CircleAlertIcon,
  CircleCheckIcon,
  Clock3Icon,
  InfoIcon,
  Loader2Icon,
  XIcon,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      closeButton
      className="app-toaster"
      toastOptions={{ unstyled: true }}
      icons={{
        success: <CircleCheckIcon className="size-6 rounded-full bg-current" stroke="white" />,
        info: <InfoIcon className="size-6 rounded-full bg-current" stroke="white" />,
        warning: <Clock3Icon className="size-6 rounded-full bg-current" stroke="white" />,
        error: <CircleAlertIcon className="size-6 rounded-full bg-current" stroke="white" />,
        loading: <Loader2Icon className="size-6 animate-spin motion-reduce:animate-none" />,
        close: <XIcon className="size-5" />,
      }}
      {...props}
    />
  );
}
