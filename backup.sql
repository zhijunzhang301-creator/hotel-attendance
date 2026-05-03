--
-- PostgreSQL database dump
--

\restrict N2jQ31adVkbS9wooccWHEHxQMqp0YF4uPdc57ntRKSbG2QdDbNbJRGVM5hdBXbQ

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attendance_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_records (
    id integer NOT NULL,
    employee_id integer,
    record_date date NOT NULL,
    clock_in timestamp with time zone,
    clock_out timestamp with time zone,
    break_minutes integer DEFAULT 0,
    break_hours_rounded numeric(4,1) DEFAULT 0,
    status character varying(20) DEFAULT 'normal'::character varying,
    modified_by integer,
    modified_at timestamp with time zone
);


ALTER TABLE public.attendance_records OWNER TO postgres;

--
-- Name: attendance_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_records_id_seq OWNER TO postgres;

--
-- Name: attendance_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_records_id_seq OWNED BY public.attendance_records.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    operator_id integer,
    action character varying(50) NOT NULL,
    target_record_id integer,
    old_value jsonb,
    new_value jsonb,
    ip_address character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    employee_no character varying(20) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'staff'::character varying,
    department character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: attendance_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records ALTER COLUMN id SET DEFAULT nextval('public.attendance_records_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Data for Name: attendance_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_records (id, employee_id, record_date, clock_in, clock_out, break_minutes, break_hours_rounded, status, modified_by, modified_at) FROM stdin;
1	2	2026-03-19	2026-03-19 05:41:00-04	2026-03-19 12:38:35.999-04	0	0.0	modified	1	2026-03-20 10:24:32.3243-04
2	2	2026-03-20	2026-03-20 10:26:25.228047-04	2026-03-20 11:09:01.152674-04	15	0.5	normal	\N	\N
3	2	2026-03-21	2026-03-21 10:04:19.284269-04	\N	0	0.0	normal	\N	\N
4	37	2026-03-21	2026-03-21 10:05:50.441174-04	\N	0	0.0	normal	\N	\N
5	37	2026-04-30	2026-04-30 11:00:00-04	\N	0	0.0	normal	\N	\N
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, operator_id, action, target_record_id, old_value, new_value, ip_address, created_at) FROM stdin;
1	2	clock_in	1	\N	\N	::1	2026-03-19 11:41:45.682655-04
2	2	clock_out	1	\N	\N	::1	2026-03-19 12:38:36.009272-04
3	1	modify	1	{"id": 1, "status": "normal", "clock_in": "2026-03-19T15:41:45.667Z", "clock_out": "2026-03-19T16:38:35.999Z", "employee_id": 2, "modified_at": null, "modified_by": null, "record_date": "2026-03-19T04:00:00.000Z", "break_minutes": 0, "break_hours_rounded": "0.0"}	{"id": 1, "status": "modified", "clock_in": "2026-03-19T09:41:00.000Z", "clock_out": "2026-03-19T16:38:35.999Z", "employee_id": 2, "modified_at": "2026-03-20T14:24:32.324Z", "modified_by": 1, "record_date": "2026-03-19T04:00:00.000Z", "break_minutes": 0, "break_hours_rounded": "0.0"}	\N	2026-03-20 10:24:32.358088-04
4	2	clock_in	2	\N	\N	::1	2026-03-20 10:26:25.244678-04
5	2	clock_out	2	\N	\N	::1	2026-03-20 11:09:01.167584-04
6	2	clock_in	3	\N	\N	::1	2026-03-21 10:04:19.309067-04
7	37	clock_in	4	\N	\N	::1	2026-03-21 10:05:50.453381-04
8	11	login	\N	\N	{"role": "manager", "employee_id": 11}	::1	2026-03-21 11:04:54.026877-04
9	11	login	\N	\N	{"role": "manager", "employee_id": 11}	::1	2026-03-21 11:04:57.646356-04
10	37	password_reset_request	\N	\N	{"role": "staff", "status": "pending", "employee_id": 37, "employee_no": "0722", "requested_at": "2026-03-21T15:04:58.208Z", "employee_name": "Bernice Zhang"}	::1	2026-03-21 11:04:58.208966-04
11	37	password_reset_request	\N	\N	{"role": "staff", "status": "pending", "employee_id": 37, "employee_no": "0722", "requested_at": "2026-03-21T15:05:29.739Z", "employee_name": "Bernice Zhang"}	::1	2026-03-21 11:05:29.74219-04
12	11	login	\N	\N	{"role": "manager", "employee_id": 11}	::1	2026-03-21 11:05:29.896597-04
13	1	login	\N	\N	{"role": "admin", "employee_id": 1}	::1	2026-03-21 11:13:24.957966-04
14	1	login	\N	\N	{"role": "admin", "employee_id": 1}	::1	2026-03-21 11:21:21.199808-04
15	3	login	\N	\N	{"role": "staff", "employee_id": 3}	127.0.0.1	2026-04-29 23:33:37.44101-04
16	4	login	\N	\N	{"role": "staff", "employee_id": 4}	127.0.0.1	2026-04-29 23:33:37.548751-04
17	5	login	\N	\N	{"role": "staff", "employee_id": 5}	127.0.0.1	2026-04-29 23:33:37.634174-04
18	6	login	\N	\N	{"role": "staff", "employee_id": 6}	127.0.0.1	2026-04-29 23:33:37.719084-04
19	7	login	\N	\N	{"role": "staff", "employee_id": 7}	127.0.0.1	2026-04-29 23:33:37.803146-04
20	8	login	\N	\N	{"role": "staff", "employee_id": 8}	127.0.0.1	2026-04-29 23:33:37.889177-04
21	9	login	\N	\N	{"role": "staff", "employee_id": 9}	127.0.0.1	2026-04-29 23:33:37.972777-04
22	10	login	\N	\N	{"role": "staff", "employee_id": 10}	127.0.0.1	2026-04-29 23:33:38.056993-04
23	11	login	\N	\N	{"role": "manager", "employee_id": 11}	127.0.0.1	2026-04-29 23:33:38.141225-04
24	12	login	\N	\N	{"role": "staff", "employee_id": 12}	127.0.0.1	2026-04-29 23:33:38.223991-04
25	13	login	\N	\N	{"role": "staff", "employee_id": 13}	127.0.0.1	2026-04-29 23:33:38.306669-04
26	14	login	\N	\N	{"role": "staff", "employee_id": 14}	127.0.0.1	2026-04-29 23:33:38.388611-04
27	15	login	\N	\N	{"role": "staff", "employee_id": 15}	127.0.0.1	2026-04-29 23:33:38.474224-04
28	16	login	\N	\N	{"role": "staff", "employee_id": 16}	127.0.0.1	2026-04-29 23:33:38.557349-04
29	17	login	\N	\N	{"role": "staff", "employee_id": 17}	127.0.0.1	2026-04-29 23:33:38.666955-04
30	18	login	\N	\N	{"role": "staff", "employee_id": 18}	127.0.0.1	2026-04-29 23:33:38.750527-04
31	19	login	\N	\N	{"role": "staff", "employee_id": 19}	127.0.0.1	2026-04-29 23:33:38.832727-04
32	20	login	\N	\N	{"role": "staff", "employee_id": 20}	127.0.0.1	2026-04-29 23:33:38.914749-04
33	21	login	\N	\N	{"role": "staff", "employee_id": 21}	127.0.0.1	2026-04-29 23:33:38.9964-04
34	22	login	\N	\N	{"role": "staff", "employee_id": 22}	127.0.0.1	2026-04-29 23:33:39.078603-04
35	23	login	\N	\N	{"role": "staff", "employee_id": 23}	127.0.0.1	2026-04-29 23:33:39.161169-04
36	24	login	\N	\N	{"role": "staff", "employee_id": 24}	127.0.0.1	2026-04-29 23:33:39.24269-04
37	25	login	\N	\N	{"role": "staff", "employee_id": 25}	127.0.0.1	2026-04-29 23:33:39.324419-04
38	26	login	\N	\N	{"role": "staff", "employee_id": 26}	127.0.0.1	2026-04-29 23:33:39.408113-04
39	27	login	\N	\N	{"role": "staff", "employee_id": 27}	127.0.0.1	2026-04-29 23:33:39.492341-04
40	28	login	\N	\N	{"role": "staff", "employee_id": 28}	127.0.0.1	2026-04-29 23:33:39.575134-04
41	29	login	\N	\N	{"role": "staff", "employee_id": 29}	127.0.0.1	2026-04-29 23:33:39.658002-04
42	30	login	\N	\N	{"role": "staff", "employee_id": 30}	127.0.0.1	2026-04-29 23:33:39.739495-04
43	31	login	\N	\N	{"role": "staff", "employee_id": 31}	127.0.0.1	2026-04-29 23:33:39.822141-04
44	32	login	\N	\N	{"role": "staff", "employee_id": 32}	127.0.0.1	2026-04-29 23:33:39.905306-04
45	33	login	\N	\N	{"role": "staff", "employee_id": 33}	127.0.0.1	2026-04-29 23:33:39.986874-04
46	34	login	\N	\N	{"role": "staff", "employee_id": 34}	127.0.0.1	2026-04-29 23:33:40.068386-04
47	35	login	\N	\N	{"role": "staff", "employee_id": 35}	127.0.0.1	2026-04-29 23:33:40.151064-04
48	36	login	\N	\N	{"role": "staff", "employee_id": 36}	127.0.0.1	2026-04-29 23:33:40.233869-04
49	37	login	\N	\N	{"role": "staff", "employee_id": 37}	127.0.0.1	2026-04-29 23:33:40.31561-04
50	38	login	\N	\N	{"role": "staff", "employee_id": 38}	127.0.0.1	2026-04-29 23:33:40.398457-04
51	1	login	\N	\N	{"role": "admin", "employee_id": 1}	127.0.0.1	2026-04-29 23:33:40.483321-04
52	2	login	\N	\N	{"role": "staff", "employee_id": 2}	127.0.0.1	2026-04-29 23:33:40.565861-04
53	11	login	\N	\N	{"role": "manager", "employee_id": 11}	127.0.0.1	2026-04-29 23:37:46.602477-04
54	37	login	\N	\N	{"role": "staff", "employee_id": 37}	127.0.0.1	2026-04-29 23:38:05.346696-04
55	23	login	\N	\N	{"role": "staff", "employee_id": 23}	127.0.0.1	2026-04-29 23:38:05.436474-04
56	7	login	\N	\N	{"role": "staff", "employee_id": 7}	127.0.0.1	2026-04-29 23:38:05.569882-04
57	1	login	\N	\N	{"role": "admin", "employee_id": 1}	127.0.0.1	2026-04-29 23:38:05.650241-04
58	2	login	\N	\N	{"role": "staff", "employee_id": 2}	127.0.0.1	2026-04-29 23:38:05.730542-04
59	11	login	\N	\N	{"role": "manager", "employee_id": 11}	127.0.0.1	2026-04-30 00:15:34.123143-04
60	11	login	\N	\N	{"role": "manager", "employee_id": 11}	127.0.0.1	2026-04-30 00:19:14.935194-04
61	11	login	\N	\N	{"role": "manager", "employee_id": 11}	127.0.0.1	2026-04-30 00:34:29.044311-04
62	11	login	\N	\N	{"role": "manager", "employee_id": 11}	127.0.0.1	2026-04-30 10:24:15.447264-04
63	11	login	\N	\N	{"role": "manager", "employee_id": 11}	127.0.0.1	2026-04-30 10:45:51.551308-04
64	37	login	\N	\N	{"role": "staff", "employee_id": 37}	127.0.0.1	2026-04-30 10:46:00.103183-04
65	37	clock_in	5	\N	\N	127.0.0.1	2026-04-30 10:46:15.679919-04
66	11	login	\N	\N	{"role": "manager", "employee_id": 11}	127.0.0.1	2026-04-30 11:06:42.023238-04
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, name, employee_no, password_hash, role, department, created_at) FROM stdin;
2	RobotA	STAFF001	$2b$10$5rctfz4p.wbngC/dSTlR1uwLr2zBRR2LYhOdZ/aI5NhR0BejFXVTq	staff	Front Desk	2026-03-19 11:08:40.208594-04
3	Henry, Natasha	0011	$2b$10$dl1hqkoc248jZ2yaIPby6O3Wen0N.DmyympwoiFO7TPbIPKQ6v8g6	staff	Laundry	2026-03-21 10:03:21.881631-04
4	Patel, Yashkumar	0017	$2b$10$V/JbHSvxJ090HotgnuKHMeSOCVM48ETy/sp/U1SIJS9t0rFxo4zuu	staff	Director of Service	2026-03-21 10:03:21.992925-04
5	Ridsdale, Amy Elizabeth	0300	$2b$10$9DqaC5T7cb0PtFzRKl2AiOmxdwCSPmHL8ofGRigKfw/vjxhKt9giq	staff	HK - Room	2026-03-21 10:03:22.064698-04
6	Singh, Harpreet	0363	$2b$10$ZrUVfqYZleU3xxTpWCGpN.yV9b1wWhrgZ/HSKAxnw/2iVLEwj3W8O	staff	HK - House	2026-03-21 10:03:22.134851-04
7	Banger, Gaurav	0384	$2b$10$zo4pOSEdYR52vax12bvlbOnGiq6mKj1fpmlhtpKXquwP7MvoBIa6W	staff	Front Desk	2026-03-21 10:03:22.204307-04
8	Murselaj, Adisona	0391	$2b$10$PmRH.jogJ6YOXzdXAni6Ie9pjER.LU7bRdtjjAaIUyNIvFB/kmTvO	staff	HK - Room	2026-03-21 10:03:22.275073-04
9	Shanner, Jaden	0392	$2b$10$sRvMinkOw8YQdUq4r0qdxOfKaTndZBW5yQsvFHElL0Ox8F0.jCoQa	staff	HK - Room	2026-03-21 10:03:22.345941-04
10	Hoeun, Chorvindyrathavon (Chorvin)	0396	$2b$10$xGNWrkoldjOd566qpU9adOxDllHNU64ZDNCrhk0bvP3TkcSekkW3a	staff	HK - Room	2026-03-21 10:03:22.416856-04
12	Kuchera, Liliia	0422	$2b$10$euwDJHXBYwSX1bvPQ2x.ZuI9aZoG.fP7ZPVKOI904y3ZHo8hvhjX2	staff	HK - Room	2026-03-21 10:03:22.720101-04
13	Patel, Prince	0478	$2b$10$rEaTAFiGQ2fiX1wLjHY7qePA.v4l7P1.XA9pfsSHDaPGwjRFXCn.u	staff	Maintenance	2026-03-21 10:03:22.790359-04
14	Li, Zhenping (Laura)	0507	$2b$10$pl0r/rS2rkoP6PlhYN2Ml.7fExUmEHGUAGLMgll6UuRDnJhzMg4ra	staff	Maintenance	2026-03-21 10:03:22.860228-04
15	Kovalyk, Halyna	0524	$2b$10$lg9gDJOkdLZ88oaIOLauHOz1v7L3j0oCpikXSfABpH.ptXKHVVZf6	staff	HK - Room	2026-03-21 10:03:22.929308-04
16	Flores, Amy	0531	$2b$10$N9b/x8jBheTGjqCmDIiqxui.kJ1UZ9IMeWrlAxpv4kx0m6mjfxyKS	staff	HK - Room	2026-03-21 10:03:23.000142-04
17	Ahir, Viken	0532	$2b$10$u1bViVtezJueN8TMZe7NhuSFBAaWRjmX0twNn5rOmECBktpGTOMYK	staff	Night Audit	2026-03-21 10:03:23.071066-04
18	Elbastawesy, Amr	0536	$2b$10$Z4mRix2Lmq7lAShIKR7f/O7.PgEZQR1ipbOcpSR1X867Wod3Jw1/q	staff	Night Audit	2026-03-21 10:03:23.140537-04
19	Nie, Jiayuan	0569	$2b$10$dyniTSrR.0zwBHDUFtlYNe43weZmGiDrQw/JDYSBvC75K2T/tjx9a	staff	Maintenance	2026-03-21 10:03:23.210527-04
20	Rafanan, Jun Patrix	0578	$2b$10$PCjQeuBI87iULcuiuSAimOITIcHkmRl0gUge20VWHTQqe3xmVHSLu	staff	HK - House	2026-03-21 10:03:23.280708-04
21	Heckert-Williams, Kai L	0580	$2b$10$ylv6BUhJzA7Be8I19H7uuulBwE55sInGOqEU7CM57E3wN2sGPFQHy	staff	HK - House	2026-03-21 10:03:23.350877-04
22	Lhaden, Sonam	0592	$2b$10$vETm4BfUTWWEpQqhwumpluQAckhc0urkRXFa8iBMG7RDPHsT2dTXC	staff	Front Desk	2026-03-21 10:03:23.422643-04
23	Dendup, Jigme Norbu	0595	$2b$10$0Ew4GuJh/osEXdgd0O0DN.EHjXLIG11vAfzQ8hxRPe7WAZlPreXki	staff	Breakfast	2026-03-21 10:03:23.492904-04
24	Ma, Lee Ann	0640	$2b$10$z1bmEmV73faOalmi94KQ4.FuFEA/WyJPQ.ejZKiviZvssBmGT.k8y	staff	HK - Room	2026-03-21 10:03:23.56325-04
25	Choden, Kezang	0654	$2b$10$1DpXe7Jg.ma/i/d8KIn0TOOklePD03MAQ7zXKTibc6FA74WiKOpfS	staff	HK - Room	2026-03-21 10:03:23.632863-04
26	Ahir, Shreya Ranchhodbhai	0666	$2b$10$E7poTrcqVGEiID30XpXUQO3M9m7yqwwgxofnaVn04nzTsupH1C7GS	staff	HK - Room	2026-03-21 10:03:23.70254-04
27	Tshering, Pema	0672	$2b$10$AX24nGHtZlDQoxNXFMEPx.vqrr3QzeN0cN5fXaGF2QpvQj1MbkIQq	staff	HK - House	2026-03-21 10:03:23.7738-04
28	Nicholas, Terence Ken	0677	$2b$10$PR39KR1lh/Z1qVVjercBm.i2j4O/431IgByWR52D0Fz2PINzuQe4.	staff	HK - House	2026-03-21 10:03:23.842755-04
29	Parikh, Nitya Nimeshbhai	0678	$2b$10$pHcP9Do/691W70ZnX0J5B.tpc02k4DHW8fEEuy6HFVyMZWmi4OMjm	staff	Maintenance	2026-03-21 10:03:23.915036-04
30	Zangmo, Tshering	0679	$2b$10$tjSoiVpllOwtY7LFK/l3r.yRJPOcd0mYGV5a4nh87x1tWtD2HHcVi	staff	HK - Room	2026-03-21 10:03:23.984795-04
31	Bhaidani, Annu Parth	0691	$2b$10$BFGoBWUcR3WzaQMe8JSvOufjKzonmi2g9eNr4xxzlz4Vh8AYgnzqW	staff	Sales Coordinator	2026-03-21 10:03:24.0549-04
32	Ortiz, Melissa	0700	$2b$10$rzItE5QV.LKSnTVyYNhu5.X3dAbJevMwM12OvH9ke3QQmErOeLqay	staff	Breakfast	2026-03-21 10:03:24.124755-04
33	Hinds, Victoria Alysa	0701	$2b$10$YbYgraUWvMIiXsacuMiOO.v2X/.FMRFvHR2HSW/B7GUbATxTzyZDW	staff	Breakfast	2026-03-21 10:03:24.195579-04
34	Jlassi, Khadija	0703	$2b$10$BKdBzuG7cIaFCo/5zzu7me7/os5ixAI1L.vKDOfE7NxyV3G.whwxm	staff	HK - Room	2026-03-21 10:03:24.265415-04
35	Bartkova, Natalia	0704	$2b$10$NYNZTVtoQwsDHUPqkBCZ2OOBEfxloFksb/qgguVx9r0E3bzN0Tz1.	staff	HK - Room	2026-03-21 10:03:24.335455-04
36	Pradhan, Alisha	0715	$2b$10$tZ0C0BjDorKfSAplhUpDAeaS/mxoyxVSwrOuGK8ydqgRswcnDknfu	staff	Front Desk	2026-03-21 10:03:24.405567-04
38	Palacios Flores, Roxana Elizabeth	0724	$2b$10$AFFYCkiTixtVgKtlR.xLgeyLETcLpvm8h0qTATXAA.LXiIsT5GRGe	staff	HK - Room	2026-03-21 10:03:24.545172-04
1	System Admin	ADMIN001	$2b$10$d/7VCngE4J9if/Loyjg2YOEiLu.KBnA2ToN7O6wpey.ECVmKHZ5r6	admin	Administration	2026-03-19 11:01:17.56181-04
11	Dhaval Fofandi	0416	$2b$10$Vt0p82YaC5uB2XYFqjMUkuYkUCkm/eqRuAmCKENIJF2KUzkvP0WKG	manager	HK Supervisor	2026-03-21 10:03:22.49006-04
37	Bernice Zhang	0722	$2b$10$jbJhY1qfINkFRGnuGRirOulk6TkPKbsl7Zl3I830GypMiJ4P8HNLK	staff	Sales Coordinator	2026-03-21 10:03:24.475266-04
\.


--
-- Name: attendance_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_records_id_seq', 5, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 66, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_id_seq', 83, true);


--
-- Name: attendance_records attendance_records_employee_id_record_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_employee_id_record_date_key UNIQUE (employee_id, record_date);


--
-- Name: attendance_records attendance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: employees employees_employee_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_no_key UNIQUE (employee_no);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: attendance_records attendance_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: attendance_records attendance_records_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_modified_by_fkey FOREIGN KEY (modified_by) REFERENCES public.employees(id);


--
-- Name: audit_logs audit_logs_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.employees(id);


--
-- Name: audit_logs audit_logs_target_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_target_record_id_fkey FOREIGN KEY (target_record_id) REFERENCES public.attendance_records(id);


--
-- PostgreSQL database dump complete
--

\unrestrict N2jQ31adVkbS9wooccWHEHxQMqp0YF4uPdc57ntRKSbG2QdDbNbJRGVM5hdBXbQ

