import React, { useState } from 'react'
import Sidebar from '../components/documentation/Sidebar/Sidebar'
import SidebarRes from '../components/documentation/SidebarResponsive/SidebarRes'
import { Article, ArticleTitle, ArticleSubTitle, Section, Scroll, ScrollTitle, ScrollSubTitle, ArticleP, Page, ScrollContainer } from '../components/documentation/ArticleElements'
import styled from 'styled-components'
import image1 from '../images/SPARC-dataset-structure.png'
import image2 from '../images/high-level-folders.gif'
import image3 from '../images/organize-folders.gif'
import image4 from '../images/organize-files.gif'
import image5 from '../images/high-level-metadata.gif'
import image6 from '../images/generate-locally.gif'
import image7 from '../images/generate-new-ds.gif'
import image8 from '../images/generate-existing.gif'

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

const OrganizeDatasets = () => {
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
                <ArticleTitle>Organize Dataset</ArticleTitle>
                <Section className='background'>
                <ArticleSubTitle>Background</ArticleSubTitle>
                <ArticleP>All SPARC datasets must follow the top level SPARC folder structure imposed by the <Link>SPARC Dataset Structure</Link>. This top level folder structure is shown in the figure below. If your data organization doesn't follow this structure inherently, you can create it virtually with SODA then either generate it locally on your computer or directly on Blackfynn (to avoid duplicating files locally).</ArticleP>
                <ImgWrap><Image src={image1} /></ImgWrap>
                <p style={{fontStyle: 'italic', textAlign: 'center'}}>Overview of the top level folder structure required for all SPARC datasets (taken from the instructions prepared by the SPARC Curation Team).</p>
                </Section>

                <Section className='how-to'>
                <ArticleSubTitle>How To</ArticleSubTitle>
                <H>Step 1: Getting started</H>
                <ArticleP>Select between organizing a new dataset or continuing to work on a previously started dataset organization process with SODA.</ArticleP>
                <H>Step 2: Specify high-level folders</H>
                <ArticleP>Select the high-level folder(s) to be included in your dataset. Refer to the description provided in the figure above about the content of each folder to determine which folder you need for your dataset. Note that a primary folder is mandatory, while all other folders are optional based on your dataset content. A high-level folder can only be included from Step 2 while it can only be removed from Step 3. You can always come back to this step to include more folders.</ArticleP>
                <ImgWrap><Image src={image2}></Image></ImgWrap>
                <H>Step 3: Structure dataset files</H>
                <ArticleP>Virtually structure your dataset using this interface as if your were organizing it on your computer but without actually modifying any local files. All your requested actions (files to be included, folders to be created, metadata information to be added, etc.) will be registered by SODA and only implemented when the dataset is generated during Step 6.</ArticleP>
                <List>
                    <ListItem>Go inside a folder by double-clicking on it.</ListItem>
                    <ListItem>Import files/folders inside a folder using drag-and-drop or the "Import" menu located in the upper right corner.</ListItem>
                    <ListItem>Create a new folder using the "New folder" button located in the upper right corner. Note that this is only possible inside a high-level SPARC folder. To create a new high-level SPARC folder, go back to Step 2.</ListItem>
                    <ListItem>Rename files/folders using the right-click menu option "Rename".</ListItem>
                    <ListItem>Remove files/folders using the right-click menu option "Delete".</ListItem>
                </List>
                <ImgWrap><Image src={image3}></Image></ImgWrap>
                <ArticleP>* Use the "Details" option from the right-click menu to see the actual path of the file and include metadata (description, Additional Metadata) which will be included in the manifest files if you request SODA to generate them automatically for you (Step 5). * Use the arrow located in the upper left corner to move up a folder. The current location in the dataset is indicated right next to the arrow.</ArticleP>
                <ImgWrap><Image src={image4}></Image></ImgWrap>
                <H>Step 4: Specify high-level metadata files</H>
                <ArticleP>Click on the applicable panel to include the high-level metadata files of your choice. Note that submission, dataset_description, and subjects files are mandatory for all datasets while the others are optional.</ArticleP>
                <ImgWrap><Image src={image5}></Image></ImgWrap>
                <H>Step 5: Request manifest files</H>
                <ArticleP>To generate and include manifest files automatically, simply toggle the option to "Yes". Then, when you generate the dataset (Step 6), a "manifest.xlsx" file will be added to each high-level SPARC folder with the "filename", "timestamp", and "file type" fields automatically populated in the correct format while the "description" and "Additional Metadata" fields will be filled when specified during Step 3. Note that any existing manifest files at the target location for generating the dataset will be replaced.</ArticleP>
                <H>Step 6: Generate dataset</H>
                <ArticleP>The dataset will be generated based on the information provided during the previous steps. It could be generated locally on your computer or directly on Blackfynn.</ArticleP>
                <ArticleP>If you select to generate your dataset locally, it will be generated at the desired location on your computer. No modifications will be made to the original files/folders specified during the previous steps.</ArticleP>
                <List>
                    <ListItem>Select desired destination to generate the dataset on your computer.</ListItem>
                    <ListItem>Enter the name of the new dataset (a folder with this name will be created at the selected destination).</ListItem>
                    <ListItem>Click "Generate" to create your dataset.
                
                    <ImgWrap><Image src={image6}></Image></ImgWrap>
                        <ArticleP>If you select to generate your dataset directly on Blackfynn, it will be generated on Blackfynn dataset with the specified structure. No modifications will be made to the original files/folders specified during the previous step.</ArticleP>
                        <List>
                            <ListItem>Select desired Blackfynn account from the drop-down list.</ListItem>
                            <ListItem>Select to generate on a new Blackfynn dataset or to use an existing one.</ListItem>
                            <ListItem><br />
                                <List>
                                    <ListItem>If you select to generate on a new Blackfynn dataset, specify a name for it.</ListItem>
                                    <ImgWrap><Image src={image7}></Image></ImgWrap>
                                    <ListItem>If you select to generate on an existing Blackfynn dataset, select one from the drop-down list, and tell SODA how to handle any existing files/folders specified in your dataset that may already existing on the selected Blackfynn dataset.</ListItem>
                                    <ImgWrap><Image src={image8}></Image></ImgWrap>
                                </List>
                            </ListItem>
                        </List>
                    </ListItem>
                    <ListItem>Click "Generate" to create your dataset.</ListItem>
                </List>
                </Section>
                <Section className='notes'>
                <ArticleSubTitle>Notes</ArticleSubTitle>
                <ArticleP>You must have "owner", "manager", or "editor" permissions on the Blackfynn dataset to generate your dataset directly there. You will automatically have "owner" permission if you decide to generate on a new dataset.</ArticleP>
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

export default OrganizeDatasets
