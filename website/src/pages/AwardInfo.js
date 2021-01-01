import React, { useState } from 'react'
import Sidebar from '../components/documentation/Sidebar/Sidebar'
import SidebarRes from '../components/documentation/SidebarResponsive/SidebarRes'
import { Article, ArticleTitle, ArticleSubTitle, Section, Scroll, ScrollTitle, ScrollSubTitle, ArticleP, Page, ScrollContainer } from '../components/documentation/ArticleElements'
import styled from 'styled-components'
import image1 from '../images/add-awards.gif'
import image2 from '../images/view-awards.gif'

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
    max-width: 100%;
`;
export const ListItem = styled.li`
    margin: 10px 0;
`;

const AwardInfo = () => {
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
                <ArticleTitle>Provide Award Information</ArticleTitle>
                <Section className='background'>
                <ArticleSubTitle>Background</ArticleSubTitle>
                <ArticleP>The milestones and associated datasets as agreed between awardees and SPARC are summarized in a document called Data Deliverables document (usually kept by the PI of the SPARC award or the award manager). In the submission metadata files, mandatory for all SPARC datasets, it is necessary to provide milestone and milestone completion date associated with your dataset exactly as specified in the Data Deliverables document. Import that document in SODA to automatically extract milestones and associated information which will be used to help you prepare the submission metadata file. You will have to do this only once and it will be then remembered by SODA during subsequent uses. Note that the information from your Data Deliverables document will be saved locally on your computer so only visible to you.</ArticleP>
                </Section>

                <Section className='how-to'>
                <ArticleSubTitle>How To</ArticleSubTitle>
                <List>
                    <ListItem>Under "Add SPARC award(s)", search for your award and add it to SODA. The list of active SPARC awards is generated automatically from the SPARC Airtable sheet once SODA is connected with your Airtable account.</ListItem>
                    <ImgWrap><Image src={image1} style={{ marginBottom: 30 + 'px'}} /></ImgWrap>
                    <ListItem>Under "View your SPARC Award(s)", you can view and edit your award and milestone information. Import the Data Deliverables document associated with your selected award. Relevant information from this document will be extracted, saved, and displayed in a table in the interface.</ListItem>
                    <ImgWrap><Image src={image2} /></ImgWrap>
                </List>
                </Section>
                <Section className='notes'>
                <ArticleSubTitle>Notes</ArticleSubTitle>
                <List>
                    <ListItem>If SODA fails to connect to your Airtable account, make sure that you have entered a valid API key in the "Connect to Airtable" feature or that you are connected to the internet.</ListItem>
                    <ListItem>You can delete an existing award by clicking on the "Delete award" button. This will remove the award from your list of awards as well as delete any associated milestone information.</ListItem>
                    <ListItem>You can also replace an existing Data Deliverables document by selecting a new file and importing it. Doing so will replace any current milestone information.</ListItem>
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

export default AwardInfo