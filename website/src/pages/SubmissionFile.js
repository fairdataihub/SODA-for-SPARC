import React, { useState } from 'react'
import Sidebar from '../components/documentation/Sidebar/Sidebar'
import SidebarRes from '../components/documentation/SidebarResponsive/SidebarRes'
import { Article, ArticleTitle, ArticleSubTitle, Section, Scroll, ScrollTitle, ScrollSubTitle, ArticleP, Page, ScrollContainer } from '../components/documentation/ArticleElements'
import styled from 'styled-components'
import image1 from '../images/submission.gif'

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

export const Link = styled.a`
    color: #0077ff;
    cursor: pointer;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const SubmissionFile = () => {
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
                <ArticleTitle>Prepare your Submission File</ArticleTitle>
                <Section className='background'>
                <ArticleSubTitle>Background</ArticleSubTitle>
                <ArticleP>Under this feature, SODA lets you rapidly prepare the submission metadata file for your dataset using information provided under the "Provide award information" feature. This feature is designed to avoid commonly found errors when preparing this file. The expected structure of this file, generated automatically by SODA, is explained in our corresponding "How to" page if you would like to learn about it.</ArticleP>
                </Section>

                <Section className='how-to'>
                <ArticleSubTitle>How To</ArticleSubTitle>
                <List>
                    <ListItem>Select an award number from the drop-down list.</ListItem>
                    <ListItem>Choose a milestone from the list compiled from the Data Deliverables document imported to SODA in the feature "Provide award information". Choose "Not specified in the Data Deliverables document" if this dataset isn't associated with any milestone initially planned.</ListItem>
                    <ListItem>Select the description corresponding to your dataset and SODA will automatically populate the associated completion date. Choose "Not specified in the Data Deliverables document" if this dataset isn't associated with any description initially planned.</ListItem>
                    <ListItem>After you complete all steps, click on "Generate" to generate your submission file. The generated file will be ready to be included in your dataset.</ListItem>
                </List>
                <ImgWrap><Image src={image1}></Image></ImgWrap>
                </Section>
            </Article>
            <ScrollContainer>
            <Scroll>
                <ScrollTitle>In this article</ScrollTitle>
                <ScrollSubTitle to='background' smooth='true'>Background</ScrollSubTitle>
                <ScrollSubTitle to='how-to' smooth='true'>How To</ScrollSubTitle>
            </Scroll>
            </ScrollContainer>
            </Page>
        </div>
    )
}

export default SubmissionFile
