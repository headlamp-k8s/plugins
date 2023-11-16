import { Dialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { DialogContent } from '@material-ui/core';
import React from 'react';

export default function AIModal(props: {
    children: React.ReactNode;
    openPopup: boolean;
    setOpenPopup: (...args) => void;
    backdropClickCallback?: (...args) => void;
    title
}) {
  const rootRef = React.useRef(null);
  const { children, openPopup, setOpenPopup,title, backdropClickCallback } = props;

  return (
    openPopup ? <div ref={rootRef}>
       <Dialog open={openPopup}
       maxWidth="lg"
       fullWidth
       withFullScreen
        onClose={() => {
            setOpenPopup(false);
            backdropClickCallback && backdropClickCallback();
        }}
        title={title}
       >
        <DialogContent>
        {children}
        </DialogContent>
       </Dialog>
    </div> : null
  );
}