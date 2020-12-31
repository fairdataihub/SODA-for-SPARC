import React, { useState } from 'react'
import Sidebar from '../components/documentation/Sidebar/Sidebar'
import SidebarRes from '../components/documentation/SidebarResponsive/SidebarRes'
import { Article, ArticleTitle, ArticleSubTitle, Section, Scroll, ScrollTitle, ScrollSubTitle, ArticleP, Page, ScrollContainer } from '../components/documentation/ArticleElements'
import styled from 'styled-components'
import image1 from '../images/add-metadata-1.gif'
import image2 from '../images/add-metadata-2.gif'

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
    list-style-type: none;
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

const Metadata = () => {
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
                <ArticleTitle>Add Metadata to Datasets</ArticleTitle>
                <Section className='background'>
                <ArticleSubTitle>Background</ArticleSubTitle>
                <ArticleP>All SPARC datasets must have the following metadata: subtitle, description, banner image, and license. These can be added easily through this feature of SODA.</ArticleP>
                </Section>

                <Section className='how-to'>
                <ArticleSubTitle>How To</ArticleSubTitle>
                <ArticleP>Start by selecting a dataset from the drop-down list. Then, the following metadata (mandatory for all SPARC datasets) can be viewed and edited:</ArticleP>
                <H>Add/edit subtitle</H>
                <ArticleP>Use the text box to add a subtitle to your dataset. Add two or three sentences (limit of 256 characters) that describe the content of your dataset such that it is possible to differentiate it from other datasets. This field will become the short description visible immediately under the title of your dataset once it is published.</ArticleP>
                <H>Add/edit description</H>
                <ArticleP>Provide a detailed description of your dataset using rich text via help from the integrated text editor so you don't need to use markdown syntax. This description will be highly visible on the SPARC data portal once your dataset is published.</ArticleP>
                <ImgWrap><Image src={image1}></Image></ImgWrap>
                <H>Upload a banner image</H>
                <ArticleP>Import, crop, and upload a banner image that meets SPARC requirements (square shape, minimum display size of 512x512 px and maximum file size of 5 MB). This image will be associated with the dataset and used as a thumbnail once the dataset is published.</ArticleP>
                <H>Assign a license</H>
                <ArticleP>Assign the Creative Commons Attribution (CC-BY) License (mandatory for all SPARC datasets) to your dataset in one click.</ArticleP>
                <ImgWrap><Image src={image2}></Image></ImgWrap>
                </Section>
                <Section className='notes'>
                <ArticleSubTitle>Notes</ArticleSubTitle>
                <ArticleP>You must have "owner" or "manager" permissions on the dataset to change its name.</ArticleP>
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

export default Metadata
