import React, { useState } from 'react'
import Sidebar from '../components/documentation/Sidebar/Sidebar'
import SidebarRes from '../components/documentation/SidebarResponsive/SidebarRes'
import { Article, ArticleTitle, ArticleSubTitle, Section, Scroll, ScrollTitle, ScrollSubTitle, ArticleP, Page, ScrollContainer } from '../components/documentation/ArticleElements'
import styled from 'styled-components'
import image1 from '../images/create-new-dataset.gif'
import image2 from '../images/rename-datasets.gif'

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

const HandleDatasets = () => {
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
                <ArticleTitle>Handle Datasets</ArticleTitle>
                <Section className='background'>
                <ArticleSubTitle>Background</ArticleSubTitle>
                <ArticleP>You can create a new dataset or rename an existing dataset on Blackfynn through this feature of SODA. The name of the dataset will be displayed as the title of the dataset when the dataset becomes public. It is thus advised to make sure that your dataset title is different than your other dataset titles and that it is relatively informative.</ArticleP>
                </Section>

                <Section className='how-to'>
                <ArticleSubTitle>How To</ArticleSubTitle>
                <List>
                    <ListItem><p style={{fontSize: 24 + 'px', fontWeight: 500}}>To create a new, empty dataset on Blackfynn:</p>
                        <List>
                            <ListItem>1. Enter the desired name for the dataset.</ListItem>
                            <ListItem>2. Click "Create".</ListItem>
                        </List>
                    </ListItem>
                    <ImgWrap><Image src={image1} style={{ marginBottom: 30 + 'px'}} /></ImgWrap>
                    <ListItem><p style={{fontSize: 24 + 'px', fontWeight: 500}}>To rename an existing dataset:</p>
                        <List>
                            <ListItem>1. Select a dataset that you wish to rename.</ListItem>
                            <ListItem>2. Enter a new name and click "Rename".</ListItem>
                        </List>
                    </ListItem>
                    <ImgWrap><Image src={image2} style={{ marginBottom: 30 + 'px'}} /></ImgWrap>
                </List>
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

export default HandleDatasets
