import { registerAppBarAction } from '@kinvolk/headlamp-plugin/lib';
import { registerDetailsViewHeaderAction } from '@kinvolk/headlamp-plugin/lib';
import { registerDetailsViewSectionsProcessor } from '@kinvolk/headlamp-plugin/lib';
import { LumosDrawer } from './components/drawer/LumosDrawer';
// import { LumosDrawer } from './components/drawer/LumosDrawer';
import { LumosButton } from './components/LumosButton';

// Below are some imports you may want to use.
//   See README.md for links to plugin development documentation.
// import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
// import { K8s } from '@kinvolk/headlamp-plugin/lib/K8s';
// import { Typography } from '@mui/material';



registerAppBarAction(<span>Hellozzzz</span>);
registerDetailsViewHeaderAction(LumosButton);

// XXNOTE: DONT NEED THIS, THIS ADDS TO THE END OF THE DETAILS VIEW
// registerDetailsViewSection(({ resource }: DetailsViewSectionProps) => {
//     if (resource?.kind === 'Pod') {
//         console.log("DETAILS VIEW SECTION");
//         return (
//             <>
//                 <div>EXAMPLE</div>
//             </>
//             // <SectionBox title="Lumos">
//             //     Example
//             // </SectionBox>
//         );
//     }
//     return null;
// });

// NOTE: STILL WIP, TRYING TO GET THE BUTTON TO BE ABLE TO TOGGLE THE SECTION DRAWER
// CURRENTLY: 
// - *WIP* need to link the button to the section toggle without redux in plugin (cannot put everything in one function,
//      will break when trying useState and useEffect)

// XXNOTE: maybe we splice to add the box at the top of the view?
registerDetailsViewSectionsProcessor(function addTopSection(resource: any, sections: any) {

    console.log("printing resource", resource);

    console.log("sections", sections);

    if (resource?.kind === 'Pod') {

        console.log("READ POD")
        sections.splice(2, 0, {
            title: 'Lumos',
            section: <LumosDrawer />,
        });
    }

    //     // // Ignore if there is no resource.
    //     // if (!resource) {
    //     //     return sections;
    //     // }

    //     // // Check if we already have added our custom section (this function may be called multiple times).
    //     // const customSectionId = 'lumos-top'
    //     // if (sections.findIndex((section: any) => section.id === customSectionId) !== -1) {
    //     //     return sections;
    //     // }

    //     // return [
    //     //     {
    //     //         id: 'lumos-top',
    //     //         section: (
    //     //             <SectionBox title="I'm the top of the world!" />
    //     //         ),
    //     //     },
    //     //     ...sections,
    //     // ];

    //     // if (
    //     //     resource?.kind === 'Pod' ||
    //     //     resource?.kind === 'Node' ||
    //     //     resource?.kind === 'Namespace' ||
    //     //     resource?.kind === 'Service' ||
    //     //     resource?.kind === 'Deployment'
    //     // ) {
    //     //     sections.push({
    //     //         title: 'Lumos',
    //     //         section: <SectionBox title="Lumos" />,
    //     //     });
    //     // }

    return sections;

});