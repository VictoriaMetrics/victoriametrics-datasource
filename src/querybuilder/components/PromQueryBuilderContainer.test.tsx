import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { act } from "react-dom/test-utils";

import { DataSourceInstanceSettings, DataSourcePluginMeta } from "@grafana/data";

import { PrometheusDatasource } from "../../datasource";
import PromQlLanguageProvider from "../../language_provider";
import { EmptyLanguageProviderMock } from "../../language_provider.mock";
import { PromQuery } from "../../types";
import { getOperationParamId } from "../shared/operationUtils";

import { PromQueryBuilderContainer } from "./PromQueryBuilderContainer";

const addOperation = async (section: string, op: string) => {
  const addOperationButton = screen.getByTitle("Add operation");
  expect(addOperationButton).toBeInTheDocument();
  await act(async () => await userEvent.click(addOperationButton))
  const sectionItem = screen.getByTitle(section);
  expect(sectionItem).toBeInTheDocument();
  // Weirdly the await userEvent.click doesn't work here, it reports the item has pointer-events: none. Don't see that
  // anywhere when debugging so not sure what style is it picking up.
  await act(async () => fireEvent.click(sectionItem.children[0]))
  const opItem = screen.getByTitle(op);
  expect(opItem).toBeInTheDocument();
  await act(async () => fireEvent.click(opItem))
}

describe("PromQueryBuilderContainer", () => {
  it("translates query between string and model", async () => {
    const { props } = setup({ expr: 'rate(metric_test{job="testjob"}[$__rate_interval])' });

    expect(screen.getByText("metric_test")).toBeInTheDocument();
    await addOperation("Range functions", "Rate");
    expect(props.onChange).toHaveBeenCalledWith({
      expr: 'rate(metric_test{job="testjob"}[$__rate_interval])',
      refId: "A",
    });
  });

  it("Can add rest param", async () => {
    const { container } = setup({ expr: "sum(ALERTS)" });
    await act(async () => await userEvent.click(screen.getByTestId("operations.0.add-rest-param")))

    waitFor(() => {
      expect(container.querySelector(`${getOperationParamId(0, 0)}`)).toBeInTheDocument();
    });
  });
});

function setup(queryOverrides: Partial<PromQuery> = {}) {
  const languageProvider = new EmptyLanguageProviderMock() as unknown as PromQlLanguageProvider;
  const datasource = new PrometheusDatasource(
    {
      url: "",
      jsonData: {},
      meta: {} as DataSourcePluginMeta,
    } as DataSourceInstanceSettings,
    undefined,
    undefined,
    languageProvider
  );

  const props = {
    datasource,
    query: {
      refId: "A",
      expr: "",
      ...queryOverrides,
    },
    onRunQuery: jest.fn(),
    onChange: jest.fn(),
    showExplain: false,
    showTrace: false
  };

  const { container } = render(<PromQueryBuilderContainer {...props} />)
  return { languageProvider, datasource, container, props };
}
