renamePool: function (prevPoolName, newPoolName) {
  console.log(prevPoolName, newPoolName);
  //check if name already exists
  if (
    this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
      newPoolName
    ] 
  ) {
    throw new Error("Pool names must be unique.");
  }
  if (
    this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
      prevPoolName
    ]
  ) {
    this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
      newPoolName
    ] =
      this["dataset-metadata"]["pool-subject-sample-structure"]["pools"][
        prevPoolName
      ];
    delete this["dataset-metadata"]["pool-subject-sample-structure"][
      "pools"
    ][prevPoolName];
  }
},