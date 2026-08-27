import os.path
import requests
from utils import create_request_headers
from constants import PENNSIEVE_URL


# check for non-empty fields (cells)
def column_check(x):
    return "unnamed" not in x.lower()


# obtain Pennsieve S3 URL for an existing metadata file
def returnFileURL(ps, item_id):
    r = requests.get(f"{PENNSIEVE_URL}/packages/{item_id}/view", headers=create_request_headers(ps))
    r.raise_for_status()

    file_details = r.json()
    file_id = file_details[0]["content"]["id"]
    r = requests.get(
        f"{PENNSIEVE_URL}/packages/{item_id}/files/{file_id}", headers=create_request_headers(ps)
    )
    r.raise_for_status()

    file_url_info = r.json()
    return file_url_info["url"]


def remove_high_level_folder_from_path(paths):
    """
        Remove the high level folder from the path. This is necessary because the high level folder is not included in the manifest file name entry.
    """

    return "" if len(paths) == 1 else "/".join(paths[1:]) + "/"




double_extensions = [
    ".tar.gz",
    ".tar.bz2",
    ".tar.xz",
    ".tar.zst",
    ".tar.lz",
    ".tar.lz4",
    ".tar.lzma",
    ".tgz",
    ".tbz",
    ".tbz2",
    ".txz",
    ".csv.gz",
    ".tsv.gz",
    ".txt.gz",
    ".json.gz",
    ".jsonl.gz",
    ".ndjson.gz",
    ".xml.gz",
    ".yaml.gz",
    ".yml.gz",
    ".log.gz",
    ".dat.gz",
    ".data.gz",
    ".bin.gz",
    ".sql.gz",
    ".nii.gz",
    ".nii.z",
    ".mgh.gz",
    ".gii.gz",
    ".annot.gz",
    ".label.gz",
    ".trk.gz",
    ".tck.gz",
    ".mif.gz",
    ".fif.gz",
    ".edf.gz",
    ".bdf.gz",
    ".set.gz",
    ".fdt.gz",
    ".vhdr.gz",
    ".vmrk.gz",
    ".eeg.gz",
    ".dcm.gz",
    ".dicom.gz",
    ".ima.gz",
    ".nrrd.gz",
    ".nhdr.gz",
    ".mha.gz",
    ".mhd.gz",
    ".hdr.gz",
    ".img.gz",
    ".ome.tif",
    ".ome.tiff",
    ".ome.btf",
    ".ome.tif2",
    ".ome.tif8",
    ".ome.xml",
    ".ome.zarr",
    ".ome.zarr.zip",
    ".tif.gz",
    ".tiff.gz",
    ".btf.gz",
    ".brukertiff.gz",
    ".mefd.gz",
    ".moberg.gz",
    ".fastq.gz",
    ".fq.gz",
    ".fasta.gz",
    ".fa.gz",
    ".fna.gz",
    ".faa.gz",
    ".sam.gz",
    ".bam.gz",
    ".cram.gz",
    ".vcf.gz",
    ".bcf.gz",
    ".bed.gz",
    ".gff.gz",
    ".gff3.gz",
    ".gtf.gz",
    ".wig.gz",
    ".bedgraph.gz",
    ".bg.gz",
    ".bcl.gz",
    ".scf.gz",
    ".vcf.bgz",
    ".bed.bgz",
    ".bedgraph.bgz",
    ".gff.bgz",
    ".gff3.bgz",
    ".gtf.bgz",
    ".h5.gz",
    ".hdf.gz",
    ".hdf5.gz",
    ".nc.gz",
    ".netcdf.gz",
    ".mat.gz",
    ".rds.gz",
    ".rda.gz",
    ".pickle.gz",
    ".pkl.gz",
    ".shp.zip",
    ".geojson.gz",
    ".gpkg.gz",
    ".kml.gz",
    ".gpx.gz",
    ".las.gz",
    ".sqlite.gz",
    ".db.gz",
    ".mdb.gz",
    ".parquet.gz",
    ".feather.gz",
    ".arrow.gz",
    ".cdf.gz",
    ".fits.gz",
    ".fit.gz",
    ".raw.gz",
    ".pdf.gz",
    ".html.gz",
    ".htm.gz",
    ".md.gz",
    ".rst.gz",
    ".zip.gz",
    ".7z.gz",
    ".rar.gz",
]



def get_name_extension(file_name):
    double_ext = False
    for ext in double_extensions:
        if file_name.find(ext) != -1:
            double_ext = True
            break

    ext = ""
    name = ""

    if double_ext == False:
        name = os.path.splitext(file_name)[0]
        ext = os.path.splitext(file_name)[1]
    else:
        ext = (
            os.path.splitext(os.path.splitext(file_name)[0])[1]
            + os.path.splitext(file_name)[1]
        )
        name = os.path.splitext(os.path.splitext(file_name)[0])[0]
    return name, ext