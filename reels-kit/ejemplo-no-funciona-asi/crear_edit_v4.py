import json,sys
sys.path.insert(0,'/home/user/web-readaptacondani/reels-kit/scripts'); from medir import fit
E=json.load(open(sys.argv[1]))          # edit.json de la v3
# 1) zoom del clip en blanco y negro más grande
E["zoom"][0]=[0.0,1.0,1.25,"L"]
# 2) "cómo funciona el tendón" con estilo de título (centrado, grande, sin sonido)
T=lambda a,t,red: [a,t,red,fit(a,146)]
title={"st":5.35,"en":6.45,"style":"title","y":960,"lines":[T("CÓMO",5.35,False),T("FUNCIONA",5.62,False),T("EL TENDÓN",5.87,True)],"sfx_in":None,"sfx_out":None}
# 3) "no imposible" destacado con sonido de error
noimp={"st":9.09,"en":9.85,"style":"caps","lines":[["NO",9.09,False,140],["IMPOSIBLE",9.27,True,140]],"sfx_in":"error","sfx_out":None}
# 5) ADAPTADO con el sonido de entrada (sin eureka)
for K in E["keys"]:
    if K["lines"][0][0]=="TOTALMENTE": K["sfx_in"]=None; K["sfx"]=[["entrada",K["lines"][1][1]-K["st"]]]
E["keys"]=sorted([title,noimp]+E["keys"],key=lambda k:k["st"])
# 4) lista: sin subtítulos mientras está, y un "boop" en cada factor
L=E["graphics"][0]; L.pop("hide_words",None); L["hide_subs"]=True
L["sfx"]=[["boop",p+0.03,1.0] for p in L["pulses"]]
# 6) "¿vas a dejar que tu tendón nunca vuelva a ser el mismo?" -> error; "¿o prefieres recuperarte?" -> eureka
E["sfx"]=[["error",2.31,1.0],["error",26.97,1.0],["eureka",27.73,2.6]]
json.dump(E,open(sys.argv[2],"w"),ensure_ascii=False,indent=1)
for K in E["keys"]: print(K["st"],K["en"],K["lines"])
