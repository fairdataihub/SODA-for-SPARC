import React from "react";

const links = [
  {
    id: "getting_starting_tab",
    label: "Overview",
    section: "getting_started",
    icon: (
      <svg
        data-section="getting_started"
        style={{ marginRight: 30, marginBottom: -5 }}
        width="20px"
        height="20px"
        viewBox="0 0 16 16"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          data-section="getting_started"
          fillRule="evenodd"
          d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm5.5 10a.5.5 0 0 0 .832.374l4.5-4a.5.5 0 0 0 0-.748l-4.5-4A.5.5 0 0 0 5.5 4v8z"
        ></path>
      </svg>
    ),
    style: { display: "none" },
  },
  {
    id: "guided_mode_view",
    label: "Curate and Share",
    section: "guided_mode",
    icon: <i className="fas fa-share-square" style={{ marginRight: 21 }}></i>,
  },
  {
    id: "documentation-view",
    label: "Documentation",
    section: "documentation",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 448 512"
        height="20px"
        width="20px"
        style={{ marginRight: 30, marginBottom: -5 }}
      >
        <path d="M448 336v-288C448 21.49 426.5 0 400 0H96C42.98 0 0 42.98 0 96v320c0 53.02 42.98 96 96 96h320c17.67 0 32-14.33 32-31.1c0-11.72-6.607-21.52-16-27.1v-81.36C441.8 362.8 448 350.2 448 336zM143.1 128h192C344.8 128 352 135.2 352 144C352 152.8 344.8 160 336 160H143.1C135.2 160 128 152.8 128 144C128 135.2 135.2 128 143.1 128zM143.1 192h192C344.8 192 352 199.2 352 208C352 216.8 344.8 224 336 224H143.1C135.2 224 128 216.8 128 208C128 199.2 135.2 192 143.1 192zM384 448H96c-17.67 0-32-14.33-32-32c0-17.67 14.33-32 32-32h288V448z" />
      </svg>
    ),
  },
  {
    id: "account-view",
    label: "Manage Accounts",
    section: "account",
    icon: (
      <svg
        height="20px"
        width="20px"
        style={{ marginRight: 30, marginBottom: -5 }}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 448 512"
      >
        <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z" />
      </svg>
    ),
  },
  {
    id: "contact-us-view",
    label: "Contact Us",
    section: "contact-us",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        height="20px"
        width="20px"
        style={{ marginRight: 30, marginBottom: -5 }}
      >
        <path d="M511.1 63.1v287.1c0 35.25-28.75 63.1-64 63.1h-144l-124.9 93.68c-7.875 5.75-19.12 .0497-19.12-9.7v-83.98h-96c-35.25 0-64-28.75-64-63.1V63.1c0-35.25 28.75-63.1 64-63.1h384C483.2 0 511.1 28.75 511.1 63.1z" />
      </svg>
    ),
  },
  {
    id: "about-view",
    label: "About SODA",
    section: "about-us",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        height="20px"
        width="20px"
        style={{ marginRight: 30, marginBottom: -5 }}
      >
        <path d="M256 8C119 8 8 119 8 256s111 248 248 248s248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200s89.5-200 200-200s200 89.5 200 200s-89.5 200-200 200zM256 128c-70.7 0-128 57.3-128 128s57.3 128 128 128s128-57.3 128-128s-57.3-128-128-128zm0 208c-44.2 0-80-35.8-80-80s35.8-80 80-80s80 35.8 80 80s-35.8 80-80 80z" />
      </svg>
    ),
  },
];

const SidebarLinks = () => {
  return (
    <ul className="list-unstyled components">
      {links.map((link) => (
        <li key={link.id} style={link.style}>
          <a href="#" data-section={link.section} id={link.id}>
            {link.icon}
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
};

export default SidebarLinks;
