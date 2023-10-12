---
title: 'SODA: Software to Support the Curation and Sharing of FAIR Peripheral Nervous System Datasets'
tags:
  - Data sharing
  - Data curation
  - Biomedical
  - Neuroscience
authors:
  - name: Christopher Marroquin
    orcid: 0000-0000-0000-0000
    affiliation: 1
  - name: Jacob Clark
    orcid: 0000-0000-0000-0000
    affiliation: 1
  - name: Dorian Portillo
    orcid: 0000-0000-0000-0000
    affiliation: 1
  - name: Sanjay Soundarajan
    orcid: 0000-0003-2829-8032
    affiliation: 1
  - name: Bhavesh Patel
    orcid: 0000-0002-0307-262X
    corresponding: true
    affiliation: 1
affiliations:
  - name: FAIR Data Innovations Hub, California Medical Innovations Institute, San Diego, CA, USA
    index: 1
date: 11 October 2023
bibliography: paper.bib
---

# Summary

SODA (Software to Organize Data Automatically) is an open source and free cross-platform desktop software that assists researchers in preparing and sharing their data according to the guidelines developed by the National Institute of Health (NIH)'s [Stimulating Peripheral Activity to Relieve Conditions (SPARC) Program](https://commonfund.nih.gov/sparc). By combining intuitive user interfaces with automation, SODA streamlines the process of implementing the SPARC guidelines.

# Statement of need

SPARC was established in 2014 to accelerate the development of therapeutic devices that modulate electrical activity in the autonomic nervous system (ANS) to improve organ function. Research on bioelectronic medicine had shown tremendous potential to address diverse conditions such as hypertension, heart failure, and gastrointestinal disorders but required further investigation and development for clinical translation, which SPARC aimed to support. In addition, the SPARC Program also supported the development of guidelines for making data resulting from such research optimally reusable in line with the FAIR (Findable, Accessible, Interoperable, Reusable) Principles [@wilkinson2016fair]. This includes nerve imaging data, electronic measurement data, and more. The goal was to provide a standard way for researchers to organize and share their ANS-related data for facilitating secondary data reuse, enabling joint analysis with different datasets, and accelerating discoveries [@quey2021knowmore, @soundarajan2022sparclink]. Accordingly, the SPARC data curation and sharing guidelines were developed [https://docs.sparc.science/docs/data-submission-walkthrough]. The guidelines prescribe the data to be organized according to the standard SPARC Data Structure (SDS) [bandrowski2021sparc] and shared publicly on [sparc.science](https://sparc.science/), the data portal of the SPARC program [@osanlouy2021sparc]. The SPARC data curation and sharing guidelines have been imposed on all SPARC-funded researchers since 2017. Since 2022, sparc.science has become an open repository so anyone with relevant data can follow the SPARC guidelines to have their dataset published.
Being part of a SPARC-funded research project in 2017, we experienced firsthand the challenges faced by researchers to organize and share their data according to the SPARC guidelines. Indeed the process to do so is very extensive as it requires several data manipulations to comply with the SDS, which includes organizing data according to a strict folder structure, following file and folder naming conventions, including several metadata files, using standard format for certain data types, and so on. Then, the resulting dataset needs to be uploaded on [Pennsieve](https://app.pennsieve.io/), the data management platform of the SPARC Program. There, the dataset is reviewed by a team of human curators and a back-and-forth could ensue to address any SDS-compliance issues before the dataset is published on sparc.science. To simplify this process for the data resulting from our SPARC-funded project, we developed Python -scripts to automate some of the steps. This automation approach was presented during a SPARC-organized Hackathon in 2018, where it received wide appreciation from other SPARC-funded researchers who were experiencing similar challenges. The project won the Public’s Choice Award at the Hackathon and subsequently received funding from the SPARC Program starting in 2019 for further development of this idea into a desktop software application that anyone can use without necessitating coding knowledge. This gave birth to SODA, the software presented in this paper [@patel2020sparc].

# Software overview

SODA is a cross-platform desktop software developed using [Electron](https://www.electronjs.org/), the open-source framework for creating desktop applications using web technologies. [Flask](https://flask.palletsprojects.com/en/3.0.x/) is used in the backend of the software to integrate with existing tools that help with complying with the SPARC guidelines that are mostly developed in Python. Further information about the technical development of SODA can be found in the [GitHub repository] (https://github.com/fairdataihub/SODA-for-SPARC).
SODA is designed as a computer wizard that guides researchers step-by-step through all the requirements for preparing and sharing their data according to the SPARC guidelines. The software combines intuitive user interfaces with automation to streamline the process. A screenshot of the home page of SODA is provided in Figure \autoref{fig:sodaui}. The development has been occurring since 2019 and is still ongoing as support for more elements of the SPARC guidelines along with additional automation have progressively been implemented. SODA integrates with other SPARC resources such as the [SDS validator](https://github.com/SciCrunch/sparc-curation), the [Pennsieve API](https://docs.pennsieve.io/), and more integrations are planned such that SODA becomes a one-stop tool for anyone wanting to make their ANS-related data FAIR through the SDS and the SPARC data curation and sharing guidelines. A full overview of what SODA support is available in its [user documentation](https://docs.sodaforsparc.io/).

![Screenshot of the user interface of the home page of SODA.\label{fig:sodaui}](soda-ui.png)

# Performance, usage, and impact

Beta testing was conducted in 2020 after about one year of developing SODA to evaluate its performance. The beta testers consisted of 10 SPARC-funded researchers from 10 different research groups who had never used SODA before but some of them had prepared and submitted data according to the SPARC guidelines without SODA. They were provided a sample dataset and asked to prepare and submit it as per the SPARC guidelines without SODA (Task A) and with only SODA (Task B). For both tasks, they were asked to complete only the steps of the SPARC data submission process supported by SODA at that time (implementing the SDS folder structure, preparing certain metadata files, uploading to Pennsieve, etc.). Half of them (randomly selected) were asked to complete Task A first then Task B while the other half were asked to complete the tasks the other way around. They were requested to report back the time required to complete each task and score out of 5 (1: very difficult, 5: very easy) the ease of understanding and implementing the SPARC guidelines for each task. Overall, we found that SODA reduced the time required to prepare and share a dataset according to the SPARC guidelines by 70% and made it relatively easier to understand and implement the requirements (Figure \autoref{fig:sodabetatesting}). After evaluating the shared datasets on Pennsieve, we found that there was an aggregate of 23 compliance errors in datasets submitted without SODA while only one error was found amongst datasets submitted with SODA. When subsequently asked if they would consistently prepare and share their data (SPARC or else) if not mandatory, a majority (8/10 yes, 2/10 maybe) responded that they would if a software like SODA was available while a majority would not without it (6/10 no, 4/10 maybe). With the improvement in user interfaces, added automation, and additional integration with other SPARC resources since then, we believe that SODA is performing even better now.

![Results from testing of SODA by 10 beta testers during 2020.\label{fig:sodabetatesting}](soda-beta-testing.png)

Given these advantages offered by SODA, it has been widely used by SPARC researchers since 2020 and by researchers in the bioelectronic medicine field outside of SPARC since 2022, when sparc.science became an open repository. Since the beginning of 2021, SODA has been downloaded over 2,000 times and has helped researchers all over the world process over 16TB of data corresponding to over 250k individual data files.
There is a major push to make data FAIR in all fields of research and in particular in biomedical research, with the NIH's leadership. As a result, many standards, guidelines, and platforms to archive data are developed to achieve that. However, the burden of understanding, learning, and using these resources for making data FAIR is mostly left to the researchers. To our knowledge, SODA is the first researcher-oriented tool for making data FAIR. It has since inspired several other tools we are developing such as [FAIRshare](https://github.com/fairdataihub/FAIRshare) through support from the National Institute of Allergies and Infectious Diseases (NIAID) and [fairhub.io](https://github.com/AI-READI/fairhub.io) through support from the NIH Bridge2AI Program. The codebase of SODA was also forked by a team that is developing a tool called [NWB GUIDE](https://github.com/NeurodataWithoutBorders/nwb-guide) to simplify the process of preparing and sharing data from the NIH Brain Initiative Program. SODA has itself been made FAIR in line with the FAIR-BioRS guidelines [@patel2023making] to promote and facilitate such reuse of its source code outside of the developing team.

# Acknowledgements
This work was supported by grants NIH U01AI150741 and NIH SPARC OT2OD030213. We thank the SPARC Data Resource Center (DRC) teams for their continuous support in the development of SODA.

# References
