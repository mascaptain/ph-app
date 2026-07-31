module.exports={
  root:true,
  env:{browser:true,es2022:true},
  parserOptions:{ecmaVersion:2022,sourceType:"module",ecmaFeatures:{jsx:true}},
  plugins:["react"],
  settings:{react:{version:"18"}},
  rules:{"no-undef":"error","no-redeclare":"error","react/jsx-uses-vars":"error","no-dupe-keys":"error"}
};
