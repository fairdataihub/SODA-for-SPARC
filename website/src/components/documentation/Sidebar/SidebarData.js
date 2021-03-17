import React from 'react'
import * as FiIcons from 'react-icons/fi'

export const SidebarData = [
    {
        title: 'Documentation Home',
        path: '/documentation'
    },
    {
        title: 'Getting Started',
        iconClosed: <FiIcons.FiChevronDown />,
        iconOpen: <FiIcons.FiChevronUp />,
        // path: '/gettingstarted',
        subNav: [
            {
                title: 'Download and Open SODA',
                path: '/documentation/getting-started/download-and-open-soda'
            },
            {
                title: 'User Interface',
                path: '/documentation/getting-started/user-interface'
            },
            {
                title: 'Organize and Submit SPARC Datasets with SODA',
                path: '/documentation/getting-started/organize-and-submit-datasets'
            },
            {
                title: 'Beta Testing',
                path: '/documentation/getting-started/beta-testing'
            },
            {
                title: 'Privacy Policy',
                path: '/documentation/getting-started/privacy-policy'
            }
        ]
    },
    {
        title: 'Manage Datasets',
        iconClosed: <FiIcons.FiChevronDown />,
        iconOpen: <FiIcons.FiChevronUp />,
        // path: '/gettingstarted',
        subNav: [
            {
                title: 'Connect to your Blackfynn Account',
                path: '/documentation/manage-datasets/connect-to-account'
            },
            {
                title: 'Handle Datasets',
                path: '/documentation/manage-datasets/handle-datasets'
            },
            {
                title: 'Add Metadata to Dataset',
                path: '/documentation/manage-datasets/add-metadata'
            },
            {
                title: 'Manage Dataset Permissions',
                path: '/documentation/manage-datasets/manage-permissions'
            },
            {
                title: 'Upload Local Dataset',
                path: '/documentation/manage-datasets/upload-dataset'
            },
            {
                title: 'View and Change Dataset Status',
                path: '/documentation/manage-datasets/view-and-change-status'
            }
        ]
    },
    {
        title: 'Prepare Metadata',
        iconClosed: <FiIcons.FiChevronDown />,
        iconOpen: <FiIcons.FiChevronUp />,
        // path: '/gettingstarted',
        subNav: [
            {
                title: 'Connect to Airtable',
                path: '/documentation/prepare-metadata/connect-to-airtable'
            },
            {
                title: 'Provide Award Information',
                path: '/documentation/prepare-metadata/provide-award-info'
            },
            {
                title: 'Prepare your Submission File',
                path: '/documentation/prepare-metadata/prepare-submission-file'
            },
            {
                title: 'Prepare Dataset Description File',
                path: '/documentation/prepare-metadata/prepare-description-file'
            },
            {
                title: 'Download Templates',
                path: '/documentation/prepare-metadata/download-templates'
            }
        ]
    },
    {
        title: 'Prepare Dataset',
        iconClosed: <FiIcons.FiChevronDown />,
        iconOpen: <FiIcons.FiChevronUp />,
        // path: '/gettingstarted',
        subNav: [
            {
                title: 'Organize Dataset',
                path: '/documentation/prepare-dataset/organize-dataset'
            }
        ]
    },
    {
        title: 'Disseminate Dataset',
        iconClosed: <FiIcons.FiChevronDown />,
        iconOpen: <FiIcons.FiChevronUp />,
        // path: '/gettingstarted',
        subNav: [
            {
                title: 'Share with Curation Team',
                path: '/documentation/disseminate-dataset/share-with-curation-team'
            },
            {
                title: 'Share with SPARC Consortium',
                path: '/documentation/disseminate-dataset/share-with-sparc-consortium'
            },
            {
                title: 'Submit for Pre-publishing Review',
                path: '/documentation/disseminate-dataset/submit-for-review'
            }
        ]
    },
    {
        title: 'Developer Guidelines',
        iconClosed: <FiIcons.FiChevronDown />,
        iconOpen: <FiIcons.FiChevronUp />,
        // path: '/gettingstarted',
        subNav: [
            {
                title: 'Using the Source Code',
                path: '/documentation/disseminate-dataset/using-source-code'
            },
            {
                title: 'Packaging',
                path: '/documentation/disseminate-dataset/packaging'
            }
        ]
    },
    {
        title: '"How to" SPARC Series',
        iconClosed: <FiIcons.FiChevronDown />,
        iconOpen: <FiIcons.FiChevronUp />,
        // path: '/gettingstarted',
        subNav: [
            {
                title: 'How to Structure the Submission Metadata File',
                path: '/documentation/how-to-sparc-series/structure-submission-metadata-file'
            },
            {
                title: 'Structure dataset_description Metadata File',
                path: '/documentation/how-to-sparc-series/structure-dataset-description-metadata-file'
            },
            {
                title: 'How to Structure the Manifest Metadata File',
                path: '/documentation/how-to-sparc-series/structure-manifest-metadata-file'
            }
        ]
    }
]