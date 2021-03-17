import React, { useState } from 'react'
import Sidebar from '../components/documentation/Sidebar/Sidebar'
import SidebarRes from '../components/documentation/SidebarResponsive/SidebarRes'
import { Article, ArticleTitle, ArticleSubTitle, Section, Scroll, ScrollTitle, ScrollSubTitle, ArticleP, Page, ScrollContainer } from '../components/documentation/ArticleElements'
import styled from 'styled-components'
import image1 from '../images/change-ds-status.gif'

export const Image = styled.img`
    width: 100%;
    
`;

export const ImgWrap =  styled.div`
    max-width: 700px;
    margin-top: 25px;
`;

export const List = styled.ul`
    margin-top: 25px;
    padding-left: 5.6%;
    list-style-type: decimal;
    width: 100%;
`;
export const ListItem = styled.li`
    margin: 10px 0;
`;

export const H = styled.div`
    font-size: 24px;
    font-weight: 500;
    width: 100%;
    margin-top: 25px;
`;

const DatasetStatus = () => {
    const [isOpen, setIsOpen] = useState(false)

    const toggle = () => {
        setIsOpen(!isOpen)
    };
    return (
        <div>
            <SidebarRes isOpen={isOpen} toggle={toggle} />
            <Sidebar toggle={toggle}/>
            <Page
            initial = {{opacity: 0}}
            animate = {{opacity: 1}}
            transition = {{duration: 1}}> 
            <Article>
                <ArticleTitle>View and change dataset status</ArticleTitle>
                <Section className='background'>
                <ArticleSubTitle>Background</ArticleSubTitle>
                <ArticleP>The status of a dataset is used to allow easy communication between SPARC investigators and the SPARC Dataset Curation Team regarding the progress of a dataset through the curation process. There are 12 status options that each SPARC Dataset will go through one by one during the submission and curation process. Each status indicates which team is responsible for the step.</ArticleP>
                </Section>

                <Section className='how-to'>
                <ArticleSubTitle>How To</ArticleSubTitle>
                <List>
                    <ListItem>Select a dataset in the dropdown list. The current status of the dataset will be shown in the dropdown list located below.</ListItem>
                    <ListItem>You can change the status simply by selecting the desired option in that dropdown list.</ListItem>
                </List>
                <ImgWrap><Image src={image1} /></ImgWrap>
                </Section>
                <Section className='notes'>
                <ArticleSubTitle>Notes</ArticleSubTitle>
                <ArticleP>You must have owner or manager permissions to change dataset status.</ArticleP>
                <ArticleP>Typically, SPARC investigators should only have to change dataset status to one of the following options:</ArticleP>
                <List>
                    <ListItem>"2. Work in Progress (Investigator)": Select to indicate that you are working on your dataset.</ListItem>
                    <ListItem>"3. Ready for Curation (Investigator)": Select to inform the SPARC Dataset Curation Team that your dataset is ready to be reviewed. You dataset will be added to the curation queue. Please note that the SPARC Dataset Curation Team will not look into your dataset until you change the status to this option.</ListItem>
                    <ListItem>"11. Complete, Under Embargo (Investigator)": Select to share your dataset with the SPARC Consortium. This will give viewer permissions to the SPARC Embargoed Data Sharing Group and will therefore allow any SPARC investigator who has signed the SPARC Non-disclosure form to see your data.</ListItem>
                    <ListItem>"12. Published (Investigator)": Select this option once you have published your dataset. One year after the initial upload of your dataset, you must publish your dataset to Blackfynn Discover, which populates the SPARC Portal. To do this, open the dataset of interest on the Blackfynn webpage, click on the Settings tab on the left, and select Publish Dataset.</ListItem>
                </List>
                </Section>
            </Article>
            <ScrollContainer>
            <Scroll>
                <ScrollTitle>In this article</ScrollTitle>
                <ScrollSubTitle to='background' smooth='true'>Background</ScrollSubTitle>
                <ScrollSubTitle to='how-to' smooth='true'>How To</ScrollSubTitle>
                <ScrollSubTitle to='notes' smooth='true'>Notes</ScrollSubTitle>
            </Scroll>
            </ScrollContainer>
            </Page>
        </div>
    )
}

export default DatasetStatus
